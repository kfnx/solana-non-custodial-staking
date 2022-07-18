import chai, { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import * as anchor from "@project-serum/anchor";
import {
  Keypair,
  ParsedAccountData,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  getMinimumBalanceForRentExemptMint,
  MintLayout,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getOrCreateAssociatedTokenAccount,
  createMintToInstruction,
  transfer,
} from "@solana/spl-token";
import { NcStaking } from "../target/types/nc_staking";
import {
  findUserStatePDA,
  airdropUser,
  getTokenBalanceByATA,
  createMetadata,
  findUserATA,
  findDelegateAuthPDA,
  findEditionPDA,
  TOKEN_METADATA_PROGRAM_ID,
  findRewardPotPDA,
  delay,
  findMetadataPDA,
  findStakeInfoPDA,
  timeNow,
  getSolanaBalance,
} from "./utils";
import { store } from "./0-constants";
import {
  claim,
  createStakingConfig,
  stake,
  unstake,
} from "./utils/transactions";
import { createAssociatedTokenAccount } from "@solana/spl-token";

chai.use(chaiAsPromised);

/**
 * Configs and NFTs are created on test 1 and 2.
 * Justin as normal and kind user test the NFT project and staking program
 * Markers as bad user attempt to exploit the program
 * uncomment the logs for debugging
 */

describe("User journey", () => {
  const {
    dev,
    justin,
    markers,
    rewardToken: rewardMint,
    nfts,
    configs,
    NFTcreator,
  } = store;
  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
  const config = configs[0].keypair;

  describe("NFT owner Justin exist", () => {
    it("User Justin created", async () => {
      await airdropUser(justin.wallet.publicKey);
      console.log(
        "Justin address",
        justin.keypair.publicKey.toBase58(),
        "balance",
        await getSolanaBalance(justin.wallet.publicKey)
      );
    });

    it("Justin initate staking", async () => {
      const [userState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );

      await program.methods
        .initStaking()
        .accounts({
          userState,
          config: config.publicKey,
          user: justin.wallet.publicKey,
        })
        .signers([justin.keypair])
        .rpc();

      const account = await program.account.user.fetch(userState);
      assert.ok(account.user.equals(justin.wallet.publicKey));
      assert.ok(account.nftsStaked.toNumber() === 0);
    });

    it("Justin cannot init staking twice", async () => {
      const [userState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );

      await expect(
        program.methods
          .initStaking()
          .accounts({
            userState,
            config: config.publicKey,
            user: justin.wallet.publicKey,
          })
          .signers([justin.keypair])
          .rpc()
      ).to.be.rejectedWith(
        "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x0"
      );
    });

    it("Justin stake one NFT", async () => {
      const tx = await stake(
        program,
        justin,
        config.publicKey,
        nfts[0].mint.publicKey
      );
      console.log(timeNow(), "stake NFT tx", tx);

      const justinATA = await findUserATA(
        justin.wallet.publicKey,
        nfts[0].mint.publicKey
      );
      const ataInfo = await justin.provider.connection.getParsedAccountInfo(
        justinATA
      );
      const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
      assert.equal(parsed.info.state, "frozen");

      const [justinState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );
      const account = await program.account.user.fetch(justinState);

      assert.ok(account.user.equals(justin.wallet.publicKey));
      assert.ok(account.nftsStaked.toNumber() === 1);
    });

    it("Justin cannot stake same NFT twice", async () => {
      await expect(
        stake(program, justin, config.publicKey, nfts[0].mint.publicKey)
      ).to.be.rejectedWith("custom program error: 0x11");
    });

    it("Justin cannot transfer his NFT if its staked (freze) to anyone", async () => {
      const justinATA = await findUserATA(
        justin.wallet.publicKey,
        nfts[0].mint.publicKey
      );
      const receiverATA = await findUserATA(
        NFTcreator.wallet.publicKey,
        nfts[0].mint.publicKey
      );

      try {
        const tx = await transfer(
          justin.provider.connection,
          justin.wallet.payer,
          justinATA,
          receiverATA,
          justin.wallet.publicKey,
          1
        );
        console.log("transfer tx", tx);
      } catch (error) {
        console.log(error);
        const balance = await getTokenBalanceByATA(
          justin.provider.connection,
          justinATA
        );
        assert.equal(1, balance, "justin NFT balance stay 1");
        assert.equal(
          error.message,
          "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x11"
        );
        return;
      }
    });

    it("Justin can unstake/thaw his own NFT after lock period finish", async () => {
      // first unstake attemp, cannot unstake because it haven't reach minimum staking period
      await expect(
        unstake(program, justin, config.publicKey, nfts[0].mint.publicKey)
      ).to.be.rejectedWith("CannotUnstakeYet");

      const justinATA = await findUserATA(
        justin.wallet.publicKey,
        nfts[0].mint.publicKey
      );
      const earlyAtaInfo =
        await justin.provider.connection.getParsedAccountInfo(justinATA);
      const parsedAcc = (<ParsedAccountData>earlyAtaInfo.value.data).parsed;
      assert.equal(
        parsedAcc.info.state,
        "frozen",
        "NFT state should be frozen if unstaking fail"
      );

      // second attempt, after reach minimum staking period, add +1s to ensure its more than duration
      const delayAmount =
        configs[0].option.stakingLockDurationInSec.toNumber() * 1000 + 1000;
      await delay(delayAmount);

      const balanceBefore = await getSolanaBalance(justin.wallet.publicKey);
      const unstakeTx = await unstake(
        program,
        justin,
        config.publicKey,
        nfts[0].mint.publicKey
      );
      console.log(timeNow(), "unstake tx", unstakeTx);
      const balanceAfter = await getSolanaBalance(justin.wallet.publicKey);
      assert.isAbove(
        balanceAfter,
        balanceBefore,
        "user solana balance after unstake should be higher"
      );

      const [stakeInfo] = await findStakeInfoPDA(
        justin.wallet.publicKey,
        nfts[0].mint.publicKey
      );
      // account should be closed and user reclaim rent fee
      await expect(
        program.account.stakeInfo.fetch(stakeInfo)
      ).to.be.rejectedWith("Account does not exist");

      const ataInfo = await justin.provider.connection.getParsedAccountInfo(
        justinATA
      );
      const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
      assert.equal(
        parsed.info.state,
        "initialized",
        "NFT state should be initialized if unstaking success"
      );
      const [justinState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );
      const account = await program.account.user.fetch(justinState);
      assert.ok(account.user.equals(justin.wallet.publicKey));
      assert.equal(account.nftsStaked.toNumber(), 0);
    });

    it("Justin cannot unstake same NFT twice", async () => {
      const [justinState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );

      const prevState = (
        await program.account.user.fetch(justinState)
      ).nftsStaked.toNumber();

      await expect(
        unstake(program, justin, config.publicKey, nfts[0].mint.publicKey)
      ).to.be.rejectedWith("AccountNotInitialized");

      const currentState = (
        await program.account.user.fetch(justinState)
      ).nftsStaked.toNumber();
      assert.ok(currentState === prevState, "nothing should change");
    });

    it("Justin can transfer his NFT if its unstaked (thaw) to anyone", async () => {
      const justinATA = await findUserATA(
        justin.wallet.publicKey,
        nfts[0].mint.publicKey
      );
      // transfered to marcus to be used on another test
      await airdropUser(markers.wallet.publicKey);
      const receiverATA = await createAssociatedTokenAccount(
        markers.provider.connection,
        markers.wallet.payer,
        nfts[0].mint.publicKey,
        markers.wallet.publicKey
      );

      const tx = await transfer(
        justin.provider.connection,
        justin.wallet.payer,
        justinATA,
        receiverATA,
        justin.wallet.publicKey,
        1
      );
      console.log("transfer tx", tx);

      const justinAtaBalance = await getTokenBalanceByATA(
        justin.provider.connection,
        justinATA
      );

      assert.equal(
        0,
        justinAtaBalance,
        "justin NFT 0 cos its transfered outside his wallet"
      );
    });

    it("Justin claim staking reward", async () => {
      const [rewardPot] = await findRewardPotPDA(
        config.publicKey,
        rewardMint.publicKey
      );
      const earlyRewardPotBalance = await getTokenBalanceByATA(
        justin.provider.connection,
        rewardPot
      );
      console.log("reward pot balance before claim: ", earlyRewardPotBalance);
      const userATA = await findUserATA(
        justin.wallet.publicKey,
        rewardMint.publicKey
      );
      const earlyUserTokenBalance = await getTokenBalanceByATA(
        justin.provider.connection,
        userATA
      );
      console.log("justin balance before claim: ", earlyUserTokenBalance);

      await delay(5000);

      const claimTx = await claim(
        program,
        justin,
        config.publicKey,
        rewardMint.publicKey
      );
      console.log(timeNow(), "claim tx", claimTx);

      const finalRewardPotBalance = await getTokenBalanceByATA(
        justin.provider.connection,
        rewardPot
      );
      console.log("reward pot balance after claim: ", finalRewardPotBalance);

      const finalUserTokenBalance = await getTokenBalanceByATA(
        justin.provider.connection,
        userATA
      );
      console.log("justin balance after claim: ", finalUserTokenBalance);

      assert.ok(finalUserTokenBalance > 0, "justin got the reward");
      const rewardPotBalanceNow = earlyRewardPotBalance - finalUserTokenBalance;
      assert.equal(
        rewardPotBalanceNow,
        finalRewardPotBalance,
        "final reward pot should be equal to early pot balance reduced by claimed reward"
      );
    });

    it("Advanced claim test", async () => {
      console.log(timeNow(), "NFT #1", nfts[1].mint.publicKey.toBase58());

      const firstStakeTx = await stake(
        program,
        justin,
        config.publicKey,
        nfts[1].mint.publicKey
      );
      console.log(timeNow(), "NFT #1 stake tx", firstStakeTx);

      await delay(3000);

      const [justinState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );
      assert.equal(
        (await program.account.user.fetch(justinState)).nftsStaked.toNumber(),
        1,
        "1 NFT staked"
      );

      console.log(timeNow(), "NFT #2", nfts[2].mint.publicKey.toBase58());

      const secondStakeTx = await stake(
        program,
        justin,
        config.publicKey,
        nfts[2].mint.publicKey
      );
      console.log(timeNow(), "NFT #2 stake tx", secondStakeTx);

      await delay(3000);

      assert.equal(
        (await program.account.user.fetch(justinState)).nftsStaked.toNumber(),
        2,
        "2 NFT staked"
      );

      console.log(timeNow(), "NFT #3", nfts[3].mint.publicKey.toBase58());

      const thirdStakeTx = await stake(
        program,
        justin,
        config.publicKey,
        nfts[3].mint.publicKey
      );
      console.log(timeNow(), "NFT #3 stake tx", thirdStakeTx);
      console.log(timeNow(), "Waiting for 3 seconds to accrue reward..");

      await delay(3000);

      assert.equal(
        (await program.account.user.fetch(justinState)).nftsStaked.toNumber(),
        3,
        "3 NFT staked"
      );

      const userATA = await findUserATA(
        justin.wallet.publicKey,
        rewardMint.publicKey
      );
      // console.log( timeNow(), "userATA", userATA.toBase58());

      const balance0 = await getTokenBalanceByATA(
        justin.provider.connection,
        userATA
      );

      const claimTx = await claim(
        program,
        justin,
        config.publicKey,
        rewardMint.publicKey
      );
      console.log(timeNow(), "[1st] claim tx", claimTx);

      const balance1 = await getTokenBalanceByATA(
        justin.provider.connection,
        userATA
      );
      const claim1rw = balance1 - balance0;
      console.log(timeNow(), "[1st] claim reward amount:", claim1rw);
      assert.isAbove(
        claim1rw,
        1799,
        "is around 2000, depend on miliseconds on the 3 stakes"
      );
      assert.isBelow(
        claim1rw,
        2601,
        "is around 2000, depend on miliseconds on the 3 stakes"
      );

      console.log(
        "Waiting for 3 seconds to accrue reward without any stake or unstake changes.."
      );
      await delay(3000);

      const claimTx2 = await claim(
        program,
        justin,
        config.publicKey,
        rewardMint.publicKey
      );
      const timeClaim2 = new Date();
      console.log(timeNow(timeClaim2), "[2nd] claim tx", claimTx2);
      const balance2 = await getTokenBalanceByATA(
        justin.provider.connection,
        userATA
      );
      const claim2rw = balance2 - balance1;
      console.log(timeNow(), "[2nd] claim reward amount:", claim2rw);
      assert.isOk(
        claim2rw === 900 || claim2rw === 1200,
        "900 or 1200 depend on the miliseconds (300/s multiply by 3-4s)"
      );

      console.log("Waiting for 750 miliseconds to accrue..");
      await delay(750);

      const claimTx3 = await claim(
        program,
        justin,
        config.publicKey,
        rewardMint.publicKey
      );
      const timeClaim3 = new Date();
      console.log(timeNow(timeClaim3), "[3nd] claim tx", claimTx3);

      const balance3 = await getTokenBalanceByATA(
        justin.provider.connection,
        userATA
      );
      const claim3rw = balance3 - balance2;
      console.log(timeNow(), "[3rd] claim reward amount:", claim3rw);

      const intervalInSeconds = Number(
        ((timeClaim3.getTime() - timeClaim2.getTime()) / 1000).toFixed(0)
      );
      const rewardPerSeconds = 300; // 100 * 3 staked
      const claimExpected = intervalInSeconds * rewardPerSeconds;
      console.log(
        "interval between 2nd to 3rd claim (seoncds):",
        intervalInSeconds
      );
      assert.equal(claim3rw, claimExpected, "Expected 300/s");

      console.log("Sequentially unstaking staked NFTs every 2 second...");

      console.log(
        timeNow(),
        "NFT #1 unstake tx",
        await unstake(program, justin, config.publicKey, nfts[1].mint.publicKey)
      );
      await delay(2000);
      console.log(
        timeNow(),
        "NFT #2 unstake tx",
        await unstake(program, justin, config.publicKey, nfts[2].mint.publicKey)
      );
      console.log(
        timeNow(),
        "NFT #3 unstake tx",
        await unstake(program, justin, config.publicKey, nfts[3].mint.publicKey)
      );

      console.log(
        "Waiting for 5 seconds.. Making sure all tx confirmed on blockchain.."
      );

      await delay(5000);

      assert.equal(
        (await program.account.user.fetch(justinState)).nftsStaked.toNumber(),
        0,
        "should be 0 because all NFT was unstaked previously"
      );

      const claimTx4 = await claim(
        program,
        justin,
        config.publicKey,
        rewardMint.publicKey
      );
      console.log(timeNow(), "[4th] claim tx", claimTx4);

      const balance4 = await getTokenBalanceByATA(
        justin.provider.connection,
        userATA
      );
      const claim4rw = balance4 - balance3;
      console.log(timeNow(), "[4th] claim reward amount:", claim4rw);
      assert.isAbove(
        claim4rw,
        499,
        "reward should be above 500 depend on miliseconds at the 3 unstakes"
      );
      assert.isBelow(
        claim4rw,
        1101,
        "reward should be below 1000 depend on miliseconds at the 3 unstakes"
      );

      await delay(2000);

      console.log(
        "Waiting for 2 seconds.. last claim should be 0 since no NFT staked anymore.."
      );

      const claimTx5 = await claim(
        program,
        justin,
        config.publicKey,
        rewardMint.publicKey
      );
      console.log(timeNow(), "[5th] claim tx", claimTx5);

      const balance5 = await getTokenBalanceByATA(
        justin.provider.connection,
        userATA
      );
      const claim5rw = balance5 - balance4;
      console.log(timeNow(), "[5th] claim reward amount:", claim5rw);

      assert.equal(
        claim5rw,
        0,
        "final claim should be 0 since all NFT are unstaked"
      );
    });
  });

  describe("Markers should not be able to exploit staking program", () => {
    it("User Markers Created", async () => {
      await airdropUser(markers.wallet.publicKey);
      console.log("Markers address", markers.keypair.publicKey.toBase58());
    });

    it("Markers initate staking", async () => {
      const [userState, _vaultBump] = await findUserStatePDA(
        markers.wallet.publicKey,
        config.publicKey
      );

      await program.methods
        .initStaking()
        .accounts({
          userState,
          config: config.publicKey,
          user: markers.wallet.publicKey,
        })
        .signers([markers.keypair])
        .rpc();

      const account = await program.account.user.fetch(userState);
      assert.ok(account.user.equals(markers.wallet.publicKey));
      assert.ok(account.nftsStaked.toNumber() === 0);
    });

    it("Markers cannot stake other user NFT (owned by Justin)", async () => {
      const justinNFTmint = nfts[0].mint.publicKey;
      const justinNFTata = await findUserATA(
        justin.wallet.publicKey,
        justinNFTmint
      );
      const [delegate] = await findDelegateAuthPDA(justinNFTata);
      const [edition] = await findEditionPDA(justinNFTmint);
      const [markersState] = await findUserStatePDA(
        markers.wallet.publicKey,
        config.publicKey
      );
      const [stakeInfo] = await findStakeInfoPDA(
        markers.wallet.publicKey,
        justinNFTmint
      );
      const metadata = await findMetadataPDA(justinNFTmint);

      await expect(
        program.methods
          .stake()
          .accounts({
            user: markers.wallet.publicKey,
            stakeInfo,
            config: config.publicKey,
            userState: markersState,
            mint: justinNFTmint,
            tokenAccount: justinNFTata,
            edition,
            delegate,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          })
          .remainingAccounts([
            {
              pubkey: metadata,
              isWritable: false,
              isSigner: false,
            },
          ])
          .signers([markers.keypair])
          .rpc()
      ).to.be.rejectedWith("ConstraintRaw");
    });

    it("Markers cannot stake Justin NFT using justin address", async () => {
      const justinNFTmint = nfts[0].mint.publicKey;
      const justinNFTata = await findUserATA(
        justin.wallet.publicKey,
        justinNFTmint
      );
      const [delegate] = await findDelegateAuthPDA(justinNFTata);
      const [edition] = await findEditionPDA(justinNFTmint);
      const [markersState] = await findUserStatePDA(
        markers.wallet.publicKey,
        config.publicKey
      );
      const [stakeInfo] = await findStakeInfoPDA(
        justin.wallet.publicKey,
        justinNFTmint
      );
      const metadata = await findMetadataPDA(justinNFTmint);

      await expect(
        program.methods
          .stake()
          .accounts({
            user: justin.wallet.publicKey,
            stakeInfo,
            config: config.publicKey,
            userState: markersState,
            mint: justinNFTmint,
            tokenAccount: justinNFTata,
            edition,
            delegate,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          })
          .remainingAccounts([
            {
              pubkey: metadata,
              isWritable: false,
              isSigner: false,
            },
          ])
          .signers([markers.keypair])
          .rpc()
      ).to.be.rejectedWith("unknown signer");
    });

    it("Markers cannot modify whitelist", async () => {
      await expect(
        program.methods
          .modifyWhitelist()
          .accounts({
            admin: dev.wallet.publicKey,
            config: config.publicKey,
            creatorAddressToWhitelist: markers.wallet.publicKey,
          })
          .signers([markers.keypair])
          .rpc()
      ).to.be.rejectedWith("unknown signer");

      // try again with markers as admin
      await expect(
        program.methods
          .modifyWhitelist()
          .accounts({
            admin: markers.wallet.publicKey,
            config: config.publicKey,
            creatorAddressToWhitelist: markers.wallet.publicKey,
          })
          .signers([markers.keypair])
          .rpc()
      ).to.be.rejectedWith("ConstraintHasOne");
    });

    it("Markers cannot stake other collection NFT (not whitelisted)", async () => {
      // setup unofficial NFT
      const mint = Keypair.generate();
      const create_mint_tx = new Transaction({
        feePayer: markers.wallet.publicKey,
      });

      create_mint_tx.add(
        SystemProgram.createAccount({
          fromPubkey: markers.wallet.publicKey,
          newAccountPubkey: mint.publicKey,
          space: MintLayout.span,
          lamports: await getMinimumBalanceForRentExemptMint(
            markers.provider.connection
          ),
          programId: TOKEN_PROGRAM_ID,
        })
      );
      create_mint_tx.add(
        createInitializeMintInstruction(
          mint.publicKey, // mint pubkey
          0, // decimals
          markers.wallet.publicKey, // mint authority
          markers.wallet.publicKey, // freeze authority (if you don't need it, you can set `null`)
          TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
        )
      );
      const create_mint_tx_sig = await markers.provider.sendAndConfirm(
        create_mint_tx,
        [markers.keypair, mint]
      );
      // console.log("create mint tx", create_mint_tx_sig);

      // Mint Fake NFT
      const markersATA = await getOrCreateAssociatedTokenAccount(
        markers.provider.connection,
        markers.wallet.payer,
        mint.publicKey,
        markers.wallet.publicKey
      );

      // console.log("create and init ATA", markersATA.address.toBase58());

      const mint_token_tx = new Transaction({
        feePayer: markers.wallet.publicKey,
      });

      mint_token_tx.add(
        createMintToInstruction(
          mint.publicKey, // mint
          markersATA.address, // receiver (should be a token account)
          markers.wallet.publicKey, // mint authority
          1, // amount. if your decimals is 8, you mint 10^8 for 1 token.
          [], // only multisig account will use. leave it empty now.
          TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
        )
      );

      const mint_token_tx_sig = await markers.provider.sendAndConfirm(
        mint_token_tx,
        [markers.keypair]
      );
      // console.log("mint token tx", mint_token_tx_sig);

      const ataBalance = await getTokenBalanceByATA(
        markers.provider.connection,
        markersATA.address
      );
      // console.log("mint", mint.publicKey.toBase58());
      // console.log("ATA", markersATA.address.toBase58());
      // console.log("balance", ataBalance);

      // Fake Dev create NFT metadata
      const metadata = await createMetadata(
        markers.provider.connection,
        markers.wallet,
        mint.publicKey
      );

      // console.log("metadata", metadata.toBase58());
      // console.log(
      //   "Fake/unofficial NFT",
      //   `https://explorer.solana.com/address/${mint.publicKey}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`
      // );

      // end fake nft
      const markersNFTmint = mint.publicKey;
      const markersNFTata = await findUserATA(
        markers.wallet.publicKey,
        markersNFTmint
      );
      const [delegate] = await findDelegateAuthPDA(markersNFTata);
      const [edition] = await findEditionPDA(markersNFTmint);
      const [markersState] = await findUserStatePDA(
        markers.wallet.publicKey,
        config.publicKey
      );
      const [stakeInfo] = await findStakeInfoPDA(
        markers.wallet.publicKey,
        markersNFTmint
      );

      await expect(
        program.methods
          .stake()
          .accounts({
            user: markers.wallet.publicKey,
            stakeInfo,
            config: config.publicKey,
            userState: markersState,
            mint: markersNFTmint,
            tokenAccount: markersNFTata,
            edition,
            delegate,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          })
          .remainingAccounts([
            {
              pubkey: metadata,
              isWritable: false,
              isSigner: false,
            },
          ])
          .signers([markers.keypair])
          .rpc()
      ).to.be.rejectedWith("NotWhitelisted");

      const ataInfo = await justin.provider.connection.getParsedAccountInfo(
        markersNFTata
      );
      // state doesnt change to freeze
      const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
      assert.equal(parsed.info.state, "initialized");
    });

    it("Markers cannot claim or unstake using his non-original staking config", async () => {
      // ensure markers have NFT
      const markersId = markers.wallet.publicKey;
      const markersNFT = nfts[0].mint.publicKey;
      const markersNftATA = await findUserATA(markersId, markersNFT);
      const balance = await getTokenBalanceByATA(
        markers.provider.connection,
        markersNftATA
      );
      assert.equal(balance, 1);

      // stake on dev config
      const tx2 = await stake(program, markers, config.publicKey, markersNFT);
      // console.log("markers stake tx", tx2);

      // markers create his own config
      const markersConfigKeypair = Keypair.generate();
      const markersConfig = markersConfigKeypair.publicKey;
      const tx3 = await createStakingConfig(
        program,
        markers,
        markersConfigKeypair,
        rewardMint.publicKey,
        NFTcreator.keypair.publicKey,
        {
          rewardDenominator: new anchor.BN(1),
          rewardPerSec: new anchor.BN(1000),
          stakingLockDurationInSec: new anchor.BN(0),
        }
      );
      // console.log("markers create his own config", tx3);

      const [markersState] = await findUserStatePDA(markersId, markersConfig);
      const tx4 = await program.methods
        .initStaking()
        .accounts({
          userState: markersState,
          config: markersConfig,
          user: markersId,
        })
        .signers([markers.keypair])
        .rpc();
      // console.log("markers init on his own config", tx4);

      // unstake using markers config
      const [delegate] = await findDelegateAuthPDA(markersNftATA);
      // console.log("user delegate", delegate.toBase58());
      const [edition] = await findEditionPDA(markersNFT);
      // console.log("edition", edition.toBase58());
      const [markersStakeInfo] = await findStakeInfoPDA(markersId, markersNFT);
      // console.log("stakeInfo", stakeInfo.toBase58());

      // stake info should not match, resulting in InvalidStakingConfig Error
      await expect(
        program.methods
          .unstake()
          .accounts({
            user: markersId,
            stakeInfo: markersStakeInfo,
            config: markersConfig,
            mint: markersNFT,
            tokenAccount: markersNftATA,
            userState: markersState,
            delegate,
            edition,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          })
          .signers([markers.keypair])
          .rpc()
      ).to.be.rejectedWith("InvalidStakingConfig");

      // claiming using different config from registered one, no stake recorded, resulting in UserNeverStake Error
      await expect(
        claim(program, markers, markersConfig, rewardMint.publicKey)
      ).to.be.rejectedWith("UserNeverStake");
    });
  });

  describe("Final program state", () => {
    it("Check program accounts", async () => {
      const allStakingAccounts = await program.account.user.all();
      assert.equal(
        allStakingAccounts.length,
        2 + 1, // 2 Justin + 1 Markers account
        "total staking accounts created"
      );

      const allStakingConfig = await program.account.stakingConfig.all();
      assert.equal(
        allStakingConfig.length,
        configs.length + 1, // +1 markers config
        "total staking configs created"
      );
    });

    it("Check overall state", async () => {
      const [justinState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );
      const justinStateAcc = await program.account.user.fetch(justinState);
      assert.equal(
        justinStateAcc.config.toBase58(),
        config.publicKey.toBase58(),
        "Justin user state account stored the config its created from"
      );
      // console.log("justinStateAcc", justinStateAcc);

      const [markersState] = await findUserStatePDA(
        markers.wallet.publicKey,
        config.publicKey
      );
      const markersStateAcc = await program.account.user.fetch(markersState);
      assert.equal(
        markersStateAcc.config.toBase58(),
        config.publicKey.toBase58(),
        "Markers user state account stored the config its created from"
      );
      // console.log("markersStateAcc", markersStateAcc);

      const stakingConfig = await program.account.stakingConfig.fetch(
        config.publicKey
      );
      assert.equal(
        stakingConfig.initiatedUsers.toNumber(),
        2,
        "Initiated users in main config"
      ); // justin + markers
    });
  });
});
