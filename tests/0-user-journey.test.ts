import chai, { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import * as anchor from "@project-serum/anchor";
import {
  Keypair,
  ParsedAccountData,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
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
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "bn.js";
import { NcStaking } from "../target/types/nc_staking";
import {
  findUserStatePDA,
  airdropUser,
  createUser,
  getTokenBalanceByATA,
  createMetadata,
  findUserATA,
  findDelegateAuthPDA,
  findEditionPDA,
  TOKEN_METADATA_PROGRAM_ID,
  findConfigAuthorityPDA,
  findRewardPotPDA,
  delay,
  findMetadataPDA,
  findStakeInfoPDA,
} from "./utils";
import { createToken } from "./utils/transaction";

chai.use(chaiAsPromised);

/**
 * This test journey covers 3 type of user:
 * Dev where all the setup happen, e.g: create NFT, create reward token, setup staking config and whitelist.
 * Justin as normal and kind user of the NFT project and staking program
 * Markers as bad user that try to exploit the program
 * uncomment the logs for debugging
 */
describe("User journey", () => {
  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
  const dev = createUser(
    Keypair.fromSecretKey(
      Uint8Array.from(
        // 6s5EfTaCCNQ855n8nTqDHue6XJ3hDaxB2ynj727AmgPt
        [
          46, 153, 255, 163, 58, 223, 86, 187, 209, 167, 46, 176, 18, 225, 156,
          176, 71, 14, 67, 109, 146, 108, 110, 61, 230, 47, 140, 147, 96, 222,
          171, 222, 87, 30, 67, 166, 139, 42, 111, 149, 250, 38, 72, 195, 127,
          111, 117, 250, 132, 207, 86, 106, 250, 33, 178, 119, 200, 158, 134,
          82, 70, 103, 165, 27,
        ]
      )
    )
  );
  const config = Keypair.generate();
  const stakingConfig = {
    rewardPerSec: new BN(100),
    rewardDenominator: new BN(1),
    stakingLockDurationInSec: new BN(5),
  };
  const rewardMint = Keypair.generate();
  const justin = createUser();
  const markers = createUser();
  const NFTmint = Keypair.generate();

  describe("Dev create NFT and setup staking config", () => {
    it("User Dev created", async () => {
      // console.log("Dev address", dev.keypair.publicKey.toBase58());
      await airdropUser(dev.wallet.publicKey);
    });

    it("Dev create staking reward token", async () => {
      await createToken(dev.keypair, rewardMint);
    });

    it("Dev create staking config #1", async () => {
      // console.log("config", config.publicKey.toBase58());
      const [configAuth, configAuthBump] = await findConfigAuthorityPDA(
        config.publicKey
      );
      // console.log("configAuth", configAuth.toBase58());

      const [rewardPot] = await findRewardPotPDA(
        config.publicKey,
        rewardMint.publicKey
      );
      // console.log("reward pot", rewardPot.toBase58());

      // init staking config
      const initStakingTx = await program.methods
        .initStakingConfig(
          configAuthBump,
          stakingConfig.rewardPerSec,
          stakingConfig.rewardDenominator,
          stakingConfig.stakingLockDurationInSec
        )
        .accounts({
          admin: dev.wallet.publicKey,
          config: config.publicKey,
          configAuthority: configAuth,
          rewardMint: rewardMint.publicKey,
          rewardPot: rewardPot,
          creatorAddressToWhitelist: dev.wallet.publicKey,
          // programs
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([dev.keypair, config])
        .rpc();
      // console.log("init config tx", initStakingTx);

      const account = await program.account.stakingConfig.fetch(
        config.publicKey
      );

      assert.ok(account.admin.equals(dev.wallet.publicKey));
      assert.ok(account.rewardMint.equals(rewardMint.publicKey));
      assert.ok(
        account.rewardPerSec.toNumber() ===
          stakingConfig.rewardPerSec.toNumber()
      );
      assert.ok(
        account.rewardDenominator.toNumber() ===
          stakingConfig.rewardDenominator.toNumber()
      );
      assert.ok(account.creatorWhitelist.equals(dev.wallet.publicKey));
    });

    it("Dev fund reward pot so user can claim reward tokens", async () => {
      const stakingConfig = await program.account.stakingConfig.fetch(
        config.publicKey
      );

      const mint_tokens_to_reward_pot_tx = new Transaction({
        feePayer: dev.wallet.publicKey,
      });
      const mint_amount = 2_000_000;
      mint_tokens_to_reward_pot_tx.add(
        createMintToInstruction(
          rewardMint.publicKey, // mint
          stakingConfig.rewardPot, // receiver (sholud be a token account)
          dev.wallet.publicKey, // mint authority
          mint_amount, // amount. if your decimals is 8, you mint 10^8 for 1 token.
          [], // only multisig account will use. leave it empty now.
          TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
        )
      );

      const tx = await dev.provider.sendAndConfirm(
        mint_tokens_to_reward_pot_tx,
        [dev.keypair]
      );
      // console.log("mint tokens to reward pot tx", tx);

      const rewardPotBalance = await getTokenBalanceByATA(
        dev.provider.connection,
        stakingConfig.rewardPot
      );
      // console.log("funded reward pot token balance: ", rewardPotBalance);

      assert.equal(mint_amount, rewardPotBalance, "reward pot funded");
    });

    it("Create, mint and give metadata to NFT #1", async () => {
      const create_mint_tx = new Transaction({
        feePayer: dev.wallet.publicKey,
      });

      create_mint_tx.add(
        SystemProgram.createAccount({
          fromPubkey: dev.wallet.publicKey,
          newAccountPubkey: NFTmint.publicKey,
          space: MintLayout.span,
          lamports: await getMinimumBalanceForRentExemptMint(
            dev.provider.connection
          ),
          programId: TOKEN_PROGRAM_ID,
        })
      );
      create_mint_tx.add(
        createInitializeMintInstruction(
          NFTmint.publicKey, // NFTmint pubkey
          0, // decimals
          dev.wallet.publicKey, // NFTmint authority
          dev.wallet.publicKey, // freeze authority (if you don't need it, you can set `null`)
          TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
        )
      );

      const create_mint_tx_sig = await dev.provider.sendAndConfirm(
        create_mint_tx,
        [dev.keypair, NFTmint]
      );
      // console.log("create NFTmint tx", create_mint_tx_sig);

      const devATA = await getOrCreateAssociatedTokenAccount(
        dev.provider.connection,
        dev.wallet.payer,
        NFTmint.publicKey,
        dev.wallet.publicKey
      );

      // console.log("create and init ATA", devATA.address.toBase58());

      const mint_token_tx = new Transaction({
        feePayer: dev.wallet.publicKey,
      });

      mint_token_tx.add(
        createMintToInstruction(
          NFTmint.publicKey, // NFTmint
          devATA.address, // receiver (should be a token account)
          dev.wallet.publicKey, // NFTmint authority
          1, // amount. if your decimals is 8, you NFTmint 10^8 for 1 token.
          [], // only multisig account will use. leave it empty now.
          TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
        )
      );

      const mint_token_tx_sig = await dev.provider.sendAndConfirm(
        mint_token_tx,
        [dev.keypair]
      );
      // console.log("mint some tokens to reward pot tx", mint_token_tx_sig);

      const ataBalance = await getTokenBalanceByATA(
        dev.provider.connection,
        devATA.address
      );
      // console.log("mint", NFTmint.publicKey.toBase58());
      // console.log("ATA", devATA.address.toBase58());
      // console.log("balance", ataBalance);

      const metadata = await createMetadata(
        dev.provider.connection,
        dev.wallet,
        NFTmint.publicKey
      );

      // console.log("metadata", metadata.toBase58());
      // console.log(
      //   "NFT",
      //   `https://explorer.solana.com/address/${NFTmint.publicKey}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`
      // );
    });

    it("Dev send NFT to Justin", async () => {
      const devATA = await getOrCreateAssociatedTokenAccount(
        dev.provider.connection,
        dev.wallet.payer,
        NFTmint.publicKey,
        dev.wallet.publicKey
      );

      // console.log("devATA.address", devATA.address.toBase58());

      const justinATA = await getOrCreateAssociatedTokenAccount(
        dev.provider.connection,
        dev.wallet.payer,
        NFTmint.publicKey,
        justin.wallet.publicKey
      );
      // console.log("justinATA.address", justinATA.address.toBase58());

      const transfer_token_tx = await transfer(
        dev.provider.connection,
        dev.wallet.payer,
        devATA.address,
        justinATA.address,
        dev.wallet.publicKey,
        1
        // [dev.wallet.payer, toWallet]
      );
      // console.log("transfer NFT to justin tx", transfer_token_tx);

      const justinAtaBalance = await getTokenBalanceByATA(
        justin.provider.connection,
        justinATA.address
      );
      // console.log("justin NFT: ", justinAtaBalance);
      assert.equal(1, justinAtaBalance, "justin NFT 1, got it from dev");

      const devAtaBalance = await getTokenBalanceByATA(
        dev.provider.connection,
        devATA.address
      );
      // console.log("Dev NFT: ", devAtaBalance);
      assert.equal(0, devAtaBalance, "Dev NFT 0, transferred to justin");
    });
  });

  describe("NFT owner Justin exist", () => {
    it("User Justin created", async () => {
      // console.log("Justin address", justin.keypair.publicKey.toBase58());
      await airdropUser(justin.wallet.publicKey);
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
      const justinATA = await findUserATA(
        justin.wallet.publicKey,
        NFTmint.publicKey
      );
      // console.log("justin ATA", justinATA.toBase58());
      const [delegate] = await findDelegateAuthPDA(justinATA);
      // console.log("justin delegate", delegate.toBase58());
      const [edition] = await findEditionPDA(NFTmint.publicKey);
      // console.log("edition", edition.toBase58());
      const [justinState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );
      // console.log("justin state", justinState.toBase58());
      const [stakeInfo] = await findStakeInfoPDA(
        justin.wallet.publicKey,
        NFTmint.publicKey
      );
      const metadata = await findMetadataPDA(NFTmint.publicKey);

      const tx = await program.methods
        .stake()
        .accounts({
          user: justin.wallet.publicKey,
          stakeInfo,
          config: config.publicKey,
          mint: NFTmint.publicKey,
          tokenAccount: justinATA,
          userState: justinState,
          delegate,
          edition,
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
        .signers([justin.keypair])
        .rpc();
      // console.log("stake NFT tx", tx);
      const ataInfo = await justin.provider.connection.getParsedAccountInfo(
        justinATA
      );
      const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
      assert.equal(parsed.info.state, "frozen");

      const account = await program.account.user.fetch(justinState);

      assert.ok(account.user.equals(justin.wallet.publicKey));
      assert.ok(account.nftsStaked.toNumber() === 1);
    });

    it("Justin cannot stake same NFT twice", async () => {
      const justinATA = await findUserATA(
        justin.wallet.publicKey,
        NFTmint.publicKey
      );
      // console.log("justin ATA", justinATA.toBase58());
      const [delegate] = await findDelegateAuthPDA(justinATA);
      // console.log("justin delegate", delegate.toBase58());
      const [edition] = await findEditionPDA(NFTmint.publicKey);
      // console.log("edition", edition.toBase58());
      const [justinState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );
      // console.log("justin state", justinState.toBase58());
      const [stakeInfo] = await findStakeInfoPDA(
        justin.wallet.publicKey,
        NFTmint.publicKey
      );
      const metadata = await findMetadataPDA(NFTmint.publicKey);

      try {
        const tx = await program.methods
          .stake()
          .accounts({
            user: justin.wallet.publicKey,
            stakeInfo,
            config: config.publicKey,
            mint: NFTmint.publicKey,
            tokenAccount: justinATA,
            userState: justinState,
            delegate,
            edition,
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
          .signers([justin.keypair])
          .rpc();
        // console.log("Stake NFT tx", tx);
      } catch (error) {
        assert.equal(
          error.message,
          "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x11"
        );
        const account = await program.account.user.fetch(justinState);
        assert.ok(account.user.equals(justin.wallet.publicKey));
        assert.ok(account.nftsStaked.toNumber() === 1, "nothing should change");
      }
    });

    it("Justin claim staking reward", async () => {
      const [configAuth, configAuthBump] = await findConfigAuthorityPDA(
        config.publicKey
      );
      console.log("configAuth", configAuth.toBase58());
      const [rewardPot, rewardPotBump] = await findRewardPotPDA(
        config.publicKey,
        rewardMint.publicKey
      );
      console.log("reward pot", rewardPot.toBase58());
      const earlyRewardPotBalance = await getTokenBalanceByATA(
        justin.provider.connection,
        rewardPot
      );
      console.log("reward pot balance before claim: ", earlyRewardPotBalance);
      const userATA = await findUserATA(
        justin.wallet.publicKey,
        rewardMint.publicKey
      );
      console.log("userATA", userATA.toBase58());
      const [userState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );
      console.log("userState", userState.toBase58());

      await delay(2000);
      try {
        const claimTx = await program.methods
          .claim(configAuthBump, rewardPotBump)
          .accounts({
            user: justin.wallet.publicKey,
            userState,
            config: config.publicKey,
            configAuthority: configAuth,
            rewardDestination: userATA,
            rewardMint: rewardMint.publicKey,
            rewardPot: rewardPot,

            // programs
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([justin.keypair])
          .rpc();
        console.log("claim tx", claimTx);
      } catch (error) {
        console.log(error);
      }

      const finalRewardPotBalance = await getTokenBalanceByATA(
        justin.provider.connection,
        rewardPot
      );
      console.log("reward pot balance after claim: ", finalRewardPotBalance);

      const finalUserTokenBalance = await getTokenBalanceByATA(
        justin.provider.connection,
        userATA
      );
      console.log("justin reward balance after claim: ", finalUserTokenBalance);

      assert.ok(finalUserTokenBalance > 0, "justin got the reward");
      const rewardPotBalanceNow = earlyRewardPotBalance - finalUserTokenBalance;
      assert.equal(
        rewardPotBalanceNow,
        finalRewardPotBalance,
        "final reward pot should be equal to early pot balance reduced by claimed reward"
      );
    });

    it("Justin cannot transfer his NFT if its staked (freze) to anyone", async () => {
      const justinATA = await findUserATA(
        justin.wallet.publicKey,
        NFTmint.publicKey
      );
      const devATA = await findUserATA(dev.wallet.publicKey, NFTmint.publicKey);

      try {
        await transfer(
          justin.provider.connection,
          justin.wallet.payer,
          justinATA,
          devATA,
          justin.wallet.publicKey,
          1
        );
      } catch (error) {
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
      const justinATA = await findUserATA(
        justin.wallet.publicKey,
        NFTmint.publicKey
      );
      // console.log("justin ATA", justinATA.toBase58());
      const [delegate] = await findDelegateAuthPDA(justinATA);
      // console.log("justin delegate", delegate.toBase58());
      const [edition] = await findEditionPDA(NFTmint.publicKey);
      // console.log("edition", edition.toBase58());
      const [justinState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );
      // console.log("justin state", justinState.toBase58());
      const [stakeInfo] = await findStakeInfoPDA(
        justin.wallet.publicKey,
        NFTmint.publicKey
      );

      // first unstake attemp, cannot unstake because haven't reach minimum staking period
      await expect(
        program.methods
          .unstake()
          .accounts({
            user: justin.wallet.publicKey,
            stakeInfo,
            config: config.publicKey,
            mint: NFTmint.publicKey,
            tokenAccount: justinATA,
            userState: justinState,
            delegate,
            edition,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          })
          .signers([justin.keypair])
          .rpc()
      ).to.be.rejectedWith("CannotUnstakeYet");

      const earlyAtaInfo =
        await justin.provider.connection.getParsedAccountInfo(justinATA);
      const parsedAcc = (<ParsedAccountData>earlyAtaInfo.value.data).parsed;
      assert.equal(parsedAcc.info.state, "frozen");

      // second attenp, after reach minimum staking period
      await delay(stakingConfig.stakingLockDurationInSec.toNumber() * 1000);
      await program.methods
        .unstake()
        .accounts({
          user: justin.wallet.publicKey,
          stakeInfo,
          config: config.publicKey,
          mint: NFTmint.publicKey,
          tokenAccount: justinATA,
          userState: justinState,
          delegate,
          edition,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([justin.keypair])
        .rpc();

      const ataInfo = await justin.provider.connection.getParsedAccountInfo(
        justinATA
      );
      const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
      assert.equal(parsed.info.state, "initialized");

      const account = await program.account.user.fetch(justinState);
      assert.ok(account.user.equals(justin.wallet.publicKey));
      assert.ok(account.nftsStaked.toNumber() === 0);
    });

    it("Justin cant unstake same NFT twice", async () => {
      const justinATA = await findUserATA(
        justin.wallet.publicKey,
        NFTmint.publicKey
      );
      // console.log("justin ATA", justinATA.toBase58());
      const [delegate] = await findDelegateAuthPDA(justinATA);
      // console.log("justin delegate", delegate.toBase58());
      const [edition] = await findEditionPDA(NFTmint.publicKey);
      // console.log("edition", edition.toBase58());
      const [justinState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );
      // console.log("justin state", justinState.toBase58());
      const [stakeInfo] = await findStakeInfoPDA(
        justin.wallet.publicKey,
        NFTmint.publicKey
      );

      const prevState = (
        await program.account.user.fetch(justinState)
      ).nftsStaked.toNumber();

      await expect(
        program.methods
          .unstake()
          .accounts({
            user: justin.wallet.publicKey,
            stakeInfo,
            config: config.publicKey,
            mint: NFTmint.publicKey,
            tokenAccount: justinATA,
            userState: justinState,
            delegate,
            edition,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          })
          .signers([justin.keypair])
          .rpc()
      ).to.be.rejectedWith("EmptyVault.");

      const currentState = (
        await program.account.user.fetch(justinState)
      ).nftsStaked.toNumber();
      assert.ok(currentState === prevState, "nothing should change");
    });

    it("Justin can transfer his NFT if its unstaked (thaw) to anyone", async () => {
      const justinATA = await findUserATA(
        justin.wallet.publicKey,
        NFTmint.publicKey
      );
      const devATA = await findUserATA(dev.wallet.publicKey, NFTmint.publicKey);

      const tfx = await transfer(
        justin.provider.connection,
        justin.wallet.payer,
        justinATA,
        devATA,
        justin.wallet.publicKey,
        1
      );

      // console.log("NFT transfer tx", tfx);

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
  });

  describe("Markers should not be able to exploit staking program", () => {
    it("User Markers Created", async () => {
      // console.log("Markers address", markers.keypair.publicKey.toBase58());
      await airdropUser(markers.wallet.publicKey);
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
      const justinNFTmint = NFTmint.publicKey;
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
      const justinNFTmint = NFTmint.publicKey;
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

    // TODO: verify this
    // it("Markers cannot unstake from with his own staking config if he previously stake on different config", async () => {
    // });

    // TODO: verify this
    // it("Markers cannot abuse claim reward token by creating his own staking config", async () => {
    // });
  });

  describe("Final program state", () => {
    it("Check program accounts", async () => {
      const allStakingAccounts = await program.account.user.all();
      assert.equal(allStakingAccounts.length, 2);

      const allStakingConfig = await program.account.stakingConfig.all();
      assert.equal(allStakingConfig.length, 1);
    });

    it("Check overall state", async () => {
      const [justinState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );
      const justinStateAcc = await program.account.user.fetch(justinState);
      assert.equal(
        justinStateAcc.config.toBase58(),
        config.publicKey.toBase58()
      );
      // console.log("justinStateAcc", justinStateAcc);

      const [markersState] = await findUserStatePDA(
        markers.wallet.publicKey,
        config.publicKey
      );
      const markersStateAcc = await program.account.user.fetch(markersState);
      assert.equal(
        markersStateAcc.config.toBase58(),
        config.publicKey.toBase58()
      );
      // console.log("markersStateAcc", markersStateAcc);

      const stakingConfig = await program.account.stakingConfig.fetch(
        config.publicKey
      );
      assert.equal(stakingConfig.initiatedUsers.toNumber(), 2); // justin + markers

      // console.log("config", stakingConfig);
    });
  });
});
