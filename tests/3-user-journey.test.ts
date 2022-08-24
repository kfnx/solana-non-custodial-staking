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

      const account = await program.account.userV2.fetch(userState);
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
      const account = await program.account.userV2.fetch(justinState);

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

    it("Justin cannot unstake/thaw his own NFT before lock period finish", async () => {
      // first unstake attempt, cannot unstake because it haven't reach minimum staking period
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
    });

    it("Justin can unstake/thaw his own NFT after lock period finish", async () => {
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

      const justinATA = await findUserATA(
        justin.wallet.publicKey,
        nfts[0].mint.publicKey
      );
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
      const account = await program.account.userV2.fetch(justinState);
      assert.ok(account.user.equals(justin.wallet.publicKey));
      assert.equal(account.nftsStaked.toNumber(), 0);
    });

    it("Justin lock time is reset when he stake another NFT on same config, thus cannot unstake", async () => {
      // fresh new stake NFT1
      const tx = await stake(
        program,
        justin,
        config.publicKey,
        nfts[0].mint.publicKey
      );
      console.log(timeNow(), "stake NFT1 tx", tx);

      const delayAmount =
        configs[0].option.stakingLockDurationInSec.toNumber() * 1000;
      await delay(delayAmount / 2);

      // second stake on same config, after half of the lock time
      const tx2 = await stake(
        program,
        justin,
        config.publicKey,
        nfts[1].mint.publicKey
      );
      console.log(timeNow(), "stake NFT2 tx", tx2);

      // finish the locktime of NFT 1 to unstake later
      await delay(delayAmount / 2 + 500);

      // unstake NFTs, should be failed cos the locktime has been reset when NFT2 staked
      console.log(timeNow(), "attempt to unstake NFT1 while time lock");
      await expect(
        unstake(program, justin, config.publicKey, nfts[0].mint.publicKey)
      ).to.be.rejectedWith("CannotUnstakeYet");
      console.log(timeNow(), "attempt to unstake NFT2 while time lock");
      await expect(
        unstake(program, justin, config.publicKey, nfts[1].mint.publicKey)
      ).to.be.rejectedWith("CannotUnstakeYet");

      // and it should be still frozen cos the unstake fail
      assert.equal(
        (<ParsedAccountData>(
          (
            await justin.provider.connection.getParsedAccountInfo(
              await findUserATA(justin.wallet.publicKey, nfts[0].mint.publicKey)
            )
          ).value.data
        )).parsed.info.state,
        "frozen"
      );

      // finish the locktime of NFT 1 to be successfully unstaked
      await delay(delayAmount / 2 + 500);

      // unstake after the lock time finished
      await unstake(program, justin, config.publicKey, nfts[0].mint.publicKey);
      await unstake(program, justin, config.publicKey, nfts[1].mint.publicKey);

      assert.equal(
        (<ParsedAccountData>(
          (
            await justin.provider.connection.getParsedAccountInfo(
              await findUserATA(justin.wallet.publicKey, nfts[0].mint.publicKey)
            )
          ).value.data
        )).parsed.info.state,
        "initialized"
      );
      assert.equal(
        (<ParsedAccountData>(
          (
            await justin.provider.connection.getParsedAccountInfo(
              await findUserATA(justin.wallet.publicKey, nfts[1].mint.publicKey)
            )
          ).value.data
        )).parsed.info.state,
        "initialized"
      );
    });

    it("Justin cannot unstake same NFT twice", async () => {
      const [justinState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );

      const prevState = (
        await program.account.userV2.fetch(justinState)
      ).nftsStaked.toNumber();

      await expect(
        unstake(program, justin, config.publicKey, nfts[0].mint.publicKey)
      ).to.be.rejectedWith("AccountNotInitialized");

      const currentState = (
        await program.account.userV2.fetch(justinState)
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

    // DEPRECATED, for now
    // it("Justin claim staking reward", async () => {
    //   const [rewardPot] = await findRewardPotPDA(
    //     config.publicKey,
    //     rewardMint.publicKey
    //   );
    //   const earlyRewardPotBalance = await getTokenBalanceByATA(
    //     justin.provider.connection,
    //     rewardPot
    //   );
    //   console.log("reward pot balance before claim: ", earlyRewardPotBalance);
    //   const justinRewardATA = await findUserATA(
    //     justin.wallet.publicKey,
    //     rewardMint.publicKey
    //   );
    //   const earlyUserTokenBalance = await getTokenBalanceByATA(
    //     justin.provider.connection,
    //     justinRewardATA
    //   );
    //   console.log("justin balance before claim: ", earlyUserTokenBalance);

    //   await delay(5000);

    //   const claimTx = await claim(
    //     program,
    //     justin,
    //     config.publicKey,
    //     rewardMint.publicKey
    //   );
    //   console.log(timeNow(), "claim tx", claimTx);

    //   const finalRewardPotBalance = await getTokenBalanceByATA(
    //     justin.provider.connection,
    //     rewardPot
    //   );
    //   console.log("reward pot balance after claim: ", finalRewardPotBalance);

    //   const finalUserTokenBalance = await getTokenBalanceByATA(
    //     justin.provider.connection,
    //     justinRewardATA
    //   );
    //   console.log("justin balance after claim: ", finalUserTokenBalance);

    //   assert.ok(finalUserTokenBalance > 0, "justin got the reward");
    //   const rewardPotBalanceNow = earlyRewardPotBalance - finalUserTokenBalance;
    //   assert.equal(
    //     rewardPotBalanceNow,
    //     finalRewardPotBalance,
    //     "final reward pot should be equal to early pot balance reduced by claimed reward"
    //   );
    // });

    /**
     * this test is very subjective, ask me @kafin if you need more explanation or walktrough to each line of code about what it means
     * the way reward works is everytime user stake/unstake it calc reward and store it but dont transfer any reward, just store like a checkpoint.
     * then everytime user claim it calc reward again + use prev stored value, then transfer the reward.
     * shortly, this test covering the expected reward given from claim.rs, covering case 1,2,3
     * it create a scenario to stake/claim and use each case, then assert expected rewardStored for stake and reward amount for claim
     */
    it("Advanced claim test: CASE 1", async () => {
      // using a clean untouched config: config[1]
      console.log(timeNow());
      const rewardPerSec =
        configs[1].option.rewardPerSec.toNumber() /
        configs[1].option.rewardDenominator.toNumber();
      const config = configs[1].keypair;

      const [userState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );

      const tx0 = await program.methods
        .initStaking()
        .accounts({
          userState,
          config: config.publicKey,
          user: justin.wallet.publicKey,
        })
        .signers([justin.keypair])
        .rpc();
      console.log(timeNow(), "init user state", tx0);

      const balance0 = await getTokenBalanceByATA(
        justin.provider.connection,
        await findUserATA(justin.wallet.publicKey, rewardMint.publicKey)
      );
      console.log("balance0", balance0);
      assert.equal(
        balance0,
        0,
        "Balance should start from 0 to make clean test"
      );

      const [justinState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );
      const rewardStored0 = (
        await program.account.userV2.fetch(justinState)
      ).rewardStored.toNumber();
      console.log("rewardStored0", rewardStored0);
      assert.equal(
        rewardStored0,
        0,
        "Reward stored should be 0 if user never stake anything"
      );

      const stake1 = await stake(
        program,
        justin,
        config.publicKey,
        nfts[1].mint.publicKey
      );
      const timeStake1 = Date.now();
      const timeStake1ceil = Math.ceil(timeStake1 / 1000);
      console.log(timeNow(), "NFT #1 stake tx", stake1);

      await delay(2000);

      const stake2 = await stake(
        program,
        justin,
        config.publicKey,
        nfts[2].mint.publicKey
      );
      const timeStake2 = Date.now();
      const timeStake2ceil = Math.ceil(timeStake2 / 1000);
      console.log(timeNow(), "NFT #2 stake tx", stake2);

      const rewardStored1 = (
        await program.account.userV2.fetch(justinState)
      ).rewardStored.toNumber();
      console.log("rewardStored1", rewardStored1);

      {
        // CASE 1 reward calc
        const duration = timeStake2ceil - timeStake1ceil;
        console.log("timeStake1", timeStake1);
        console.log("timeStake1ceil", timeStake1ceil);
        console.log("timeStake2", timeStake2);
        console.log("timeStake2ceil", timeStake2ceil);
        console.log("duration", duration, "seconds");
        const stakedNFTs = 1;
        const expectedReward = duration * rewardPerSec * stakedNFTs;
        console.log("stakedNFTs", stakedNFTs);
        console.log("rewardPerSec", rewardPerSec);
        console.log("expectedReward", expectedReward);
        assert.closeTo(
          rewardStored1,
          expectedReward,
          1, // each code have execution time that add the delay, so we have delta here
          "Reward stored should be above 0 after second stake"
        );
      }

      // wait for another 2 seconds to check basic bonus accrual (1 igs)
      await delay(2000);

      // claim should be using CASE 1 (reward_stored + reward_now)
      const claim1Tx = await claim(
        program,
        justin,
        config.publicKey,
        rewardMint.publicKey
      );
      const timeClaim1Tx = Date.now();
      const timeClaim1Txceil = Math.ceil(timeClaim1Tx / 1000);
      console.log(timeNow(), "claim1Tx", claim1Tx);

      const balance1 = await getTokenBalanceByATA(
        justin.provider.connection,
        await findUserATA(justin.wallet.publicKey, rewardMint.publicKey)
      );
      console.log("balance1", balance1, "| before", balance0);

      {
        // CASE 1 reward calc
        const duration = timeClaim1Txceil - timeStake2ceil;
        console.log("timeStake2", timeStake2);
        console.log("timeStake2ceil", timeStake2ceil);
        console.log("timeClaim1Tx", timeClaim1Tx);
        console.log("timeClaim1Txceil", timeClaim1Txceil);
        console.log("duration", duration, "seconds");
        const stakedNFTs = 2;
        const expectedReward = duration * rewardPerSec * stakedNFTs;
        console.log("stakedNFTs", stakedNFTs);
        console.log("rewardPerSec", rewardPerSec);
        console.log("expectedReward", expectedReward);
        assert.equal(
          balance1,
          rewardStored1 + expectedReward,
          "Balance should be increased after a valid claim"
        );
      }

      // claim #2 all should be 0 cos prev claim. reward_stored = 0, reward_now = 0
      // second claim instantly after first claim
      // claim should be using CASE 1 (reward_stored + reward_now)
      const claim2Tx = await claim(
        program,
        justin,
        config.publicKey,
        rewardMint.publicKey
      );
      const timeClaim2Tx = Date.now();
      const timeClaim2Txceil = Math.ceil(timeClaim2Tx / 1000);
      console.log(timeNow(), "claim2Tx", claim2Tx);

      const balance2 = await getTokenBalanceByATA(
        justin.provider.connection,
        await findUserATA(justin.wallet.publicKey, rewardMint.publicKey)
      );
      console.log("balance2", balance2, "| before", balance1);
      // there could be some problem if with the execution time
      // resulting in the 2nd claim accruing reward for 1 seconds
      // (1 seconds duration, 2 nft staked, 1/s reward = 1*2*1 = 2)
      // so we are using isBelow with the value + 2.1

      {
        // CASE 1 reward calc
        const duration = timeClaim2Txceil - timeClaim1Txceil;
        console.log("timeClaim1Tx", timeClaim1Tx);
        console.log("timeClaim1Txceil", timeClaim1Txceil);
        console.log("timeClaim2Tx", timeClaim2Tx);
        console.log("timeClaim2Txceil", timeClaim2Txceil);
        console.log("duration", duration, "seconds");
        const stakedNFTs = 2;
        const expectedReward = duration * rewardPerSec * stakedNFTs;
        console.log("stakedNFTs", stakedNFTs);
        console.log("rewardPerSec", rewardPerSec);
        console.log("expectedReward", expectedReward);
        assert.equal(
          balance2,
          balance1 + expectedReward,
          "Balance should be the same as previous claim, because second claim return 0 reward"
        );
      }

      const rewardStored2 = (
        await program.account.userV2.fetch(justinState)
      ).rewardStored.toNumber();
      console.log("rewardStored2", rewardStored2);
      assert.equal(
        rewardStored2,
        0,
        "Reward stored should be zeroed after a claim, only stake and unstake can increment reward stored"
      );

      // wait for lock time to finish
      const locktime =
        configs[1].option.stakingLockDurationInSec.toNumber() * 1000;
      await delay(locktime);

      // claim should be using CASE 3
      const claim3Tx = await claim(
        program,
        justin,
        config.publicKey,
        rewardMint.publicKey
      );
      console.log(timeNow(), "claim3Tx", claim3Tx);

      const balance3 = await getTokenBalanceByATA(
        justin.provider.connection,
        await findUserATA(justin.wallet.publicKey, rewardMint.publicKey)
      );
      console.log("balance3", balance3, "| before", balance2);
      // assert.isAbove(balance3, balance3);

      // claim should be using CASE 2
      const claim4Tx = await claim(
        program,
        justin,
        config.publicKey,
        rewardMint.publicKey
      );
      console.log(timeNow(), "claim4tx", claim4Tx);

      const balance4 = await getTokenBalanceByATA(
        justin.provider.connection,
        await findUserATA(justin.wallet.publicKey, rewardMint.publicKey)
      );
      console.log("balance4", balance4);
    });
  });

  describe("Markers should not be able to exploit staking program", () => {
    it("User Markers Created", async () => {
      await airdropUser(markers.wallet.publicKey);
      console.log("Markers address", markers.keypair.publicKey.toBase58());
    });

    it("Markers cannot initate staking with justin state", async () => {
      const [userState, _vaultBump] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );

      await expect(
        program.methods
          .initStaking()
          .accounts({
            userState,
            config: config.publicKey,
            user: markers.wallet.publicKey,
          })
          .signers([markers.keypair])
          .rpc()
      ).to.be.rejectedWith("unauthorized signer or writable account");
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

      const account = await program.account.userV2.fetch(userState);
      assert.ok(account.user.equals(markers.wallet.publicKey));
      assert.ok(account.nftsStaked.toNumber() === 0);
    });

    it("Markers cannot stake Markers NFT using justin userstate", async () => {
      const markersNFT = nfts[0].mint.publicKey;
      const markersNFTAta = await findUserATA(
        justin.wallet.publicKey,
        markersNFT
      );
      const [delegate] = await findDelegateAuthPDA(markersNFTAta);
      const [edition] = await findEditionPDA(markersNFT);
      const [justinState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );
      const [stakeInfo] = await findStakeInfoPDA(
        markers.wallet.publicKey,
        markersNFT
      );
      const metadata = await findMetadataPDA(markersNFT);

      await expect(
        program.methods
          .stake()
          .accounts({
            user: markers.wallet.publicKey,
            stakeInfo,
            config: config.publicKey,
            userState: justinState,
            mint: markersNFT,
            tokenAccount: markersNFTAta,
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
      ).to.be.rejectedWith("ConstraintSeeds");
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

    // modify whitelist removed
    // it("Markers cannot modify whitelist", async () => {
    //   await expect(
    //     program.methods
    //       .modifyWhitelist()
    //       .accounts({
    //         admin: dev.wallet.publicKey,
    //         config: config.publicKey,
    //         creatorAddressToWhitelist: markers.wallet.publicKey,
    //       })
    //       .signers([markers.keypair])
    //       .rpc()
    //   ).to.be.rejectedWith("unknown signer");

    //   // try again with markers as admin
    //   await expect(
    //     program.methods
    //       .modifyWhitelist()
    //       .accounts({
    //         admin: markers.wallet.publicKey,
    //         config: config.publicKey,
    //         creatorAddressToWhitelist: markers.wallet.publicKey,
    //       })
    //       .signers([markers.keypair])
    //       .rpc()
    //   ).to.be.rejectedWith("ConstraintHasOne");
    // });

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
    // it("Check program accounts", async () => {
    //   const allStakingAccounts = await program.account.userV2.all();
    //   assert.equal(
    //     allStakingAccounts.length,
    //     configs.length + 1, // 2 Justin on each config + 1 Markers account
    //     "total staking accounts created"
    //   );

    //   const allStakingConfig = await program.account.stakingConfig.all();
    //   assert.equal(
    //     allStakingConfig.length,
    //     configs.length + 1, // + 1 Markers config
    //     "total staking configs created"
    //   );
    // });

    it("Check overall state", async () => {
      const [justinState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );
      const justinStateAcc = await program.account.userV2.fetch(justinState);
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
      const markersStateAcc = await program.account.userV2.fetch(markersState);
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
