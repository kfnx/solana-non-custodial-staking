import { assert } from "chai";
import * as anchor from "@project-serum/anchor";
import { NcStaking } from "../target/types/nc_staking";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MintLayout,
  getMinimumBalanceForRentExemptMint,
  createInitializeMintInstruction,
  createMintToInstruction,
} from "@solana/spl-token";
import {
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import { BN } from "bn.js";
import {
  delay,
  airdropUser,
  createUser,
  findUserATA,
  getTokenBalanceByATA,
  findConfigAuthorityPDA,
  findRewardPotPDA,
  findUserStatePDA,
} from "./utils";

describe("Claiming staking token reward", () => {
  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
  const config = Keypair.generate();
  const mint = Keypair.generate();
  const admin = createUser();
  const user = createUser();
  const programId = program.programId;

  describe("Setup accounts", () => {
    it("accounts", async () => {
      console.log("programId", programId.toBase58());
      console.log("config", config.publicKey.toBase58());
      console.log("mint", mint.publicKey.toBase58());
      console.log("admin", admin.wallet.publicKey.toBase58());
      console.log("user", user.wallet.publicKey.toBase58());
      await airdropUser(user.wallet.publicKey);
      await airdropUser(admin.wallet.publicKey);
    });
  });

  describe("Admin setup config", () => {
    it("admin create token for reward", async () => {
      const create_mint_tx = new Transaction({
        feePayer: admin.wallet.publicKey,
      });

      create_mint_tx.add(
        SystemProgram.createAccount({
          fromPubkey: admin.wallet.publicKey,
          newAccountPubkey: mint.publicKey,
          space: MintLayout.span,
          lamports: await getMinimumBalanceForRentExemptMint(
            admin.provider.connection
          ),
          programId: TOKEN_PROGRAM_ID,
        })
      );
      create_mint_tx.add(
        createInitializeMintInstruction(
          mint.publicKey, // mint pubkey
          0, // decimals
          admin.wallet.publicKey, // mint authority
          admin.wallet.publicKey, // freeze authority (if you don't need it, you can set `null`)
          TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
        )
      );
      const create_mint_tx_sig = await admin.provider.sendAndConfirm(
        create_mint_tx,
        [admin.keypair, mint]
      );
      console.log("create mint tx", create_mint_tx_sig);
    });

    it("admin create staking config", async () => {
      const [configAuth, configAuthBump] = await findConfigAuthorityPDA(
        config.publicKey,
        programId
      );
      console.log("configAuth", configAuth.toBase58());

      const [rewardPot, _rewardPotBump] = await findRewardPotPDA(
        config.publicKey,
        mint.publicKey,
        programId
      );
      console.log("reward pot", rewardPot.toBase58());

      // init staking config
      const rewardRate = new BN(10);
      const initStakingTx = await program.methods
        .initStakingConfig(configAuthBump, rewardRate)
        .accounts({
          admin: admin.wallet.publicKey,
          config: config.publicKey,
          configAuthority: configAuth,
          rewardMint: mint.publicKey,
          rewardPot: rewardPot,
          // programs
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([admin.keypair, config])
        .rpc();
      console.log("init config tx", initStakingTx);

      const allStakingAccounts = await program.account.stakingConfig.all();
      assert.equal(
        allStakingAccounts.length,
        1,
        "there should be 1 staking config account"
      );

      const account = await program.account.stakingConfig.fetch(
        config.publicKey
      );

      assert.ok(account.admin.equals(admin.wallet.publicKey));
      assert.ok(account.rewardMint.equals(mint.publicKey));
      assert.ok(account.rewardRate.toNumber() === rewardRate.toNumber());
    });

    it("admin fund reward pot so user can claim", async () => {
      const stakingConfig = await program.account.stakingConfig.fetch(
        config.publicKey
      );

      const mint_tokens_to_reward_pot_tx = new Transaction({
        feePayer: admin.wallet.publicKey,
      });
      const mint_amount = 2_000_000;
      mint_tokens_to_reward_pot_tx.add(
        createMintToInstruction(
          mint.publicKey, // mint
          stakingConfig.rewardPot, // receiver (sholud be a token account)
          admin.wallet.publicKey, // mint authority
          mint_amount, // amount. if your decimals is 8, you mint 10^8 for 1 token.
          [], // only multisig account will use. leave it empty now.
          TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
        )
      );

      const mint_tokens_to_reward_pot_tx_sig =
        await admin.provider.sendAndConfirm(mint_tokens_to_reward_pot_tx, [
          admin.keypair,
        ]);
      console.log(
        "mint some tokens to reward pot tx",
        mint_tokens_to_reward_pot_tx_sig
      );

      const rewardPotBalance = await getTokenBalanceByATA(
        admin.provider.connection,
        stakingConfig.rewardPot
      );
      console.log("funded reward pot token balance: ", rewardPotBalance);

      assert.equal(mint_amount, rewardPotBalance, "reward pot funded");
    });
  });

  describe("User claiming reward", () => {
    it("User initate staking and stake NFT", async () => {
      const [userState, _vaultBump] = await findUserStatePDA(
        user.wallet.publicKey,
        program.programId
      );

      await program.methods
        .initStaking()
        .accounts({
          user: user.wallet.publicKey,
          userState,
        })
        .signers([user.keypair])
        .rpc();

      const account = await program.account.user.fetch(userState);
      assert.ok(account.user.equals(user.wallet.publicKey));
      assert.ok(account.nftsStaked.toNumber() === 0);

      await program.methods
        .stake()
        .accounts({
          userState,
          user: user.wallet.publicKey,
        })
        .signers([user.keypair])
        .rpc();

      const updatedAccount = await program.account.user.fetch(userState);
      assert.ok(updatedAccount.nftsStaked.toNumber() === 1);
    });

    it("user claim token reward with previously created staking config", async () => {
      const [configAuth, configAuthBump] = await findConfigAuthorityPDA(
        config.publicKey,
        programId
      );
      console.log("configAuth", configAuth.toBase58());

      const [rewardPot, rewardPotBump] = await findRewardPotPDA(
        config.publicKey,
        mint.publicKey,
        programId
      );
      console.log("reward pot", rewardPot.toBase58());
      const earlyRewardPotBalance = await getTokenBalanceByATA(
        user.provider.connection,
        rewardPot
      );
      console.log(
        "reward pot token balance (before claim): ",
        earlyRewardPotBalance
      );

      const userATA = await findUserATA(user.wallet.publicKey, mint.publicKey);
      const [userState, _bump] = await findUserStatePDA(
        user.wallet.publicKey,
        programId
      );

      console.log("userATA", userATA.toBase58());
      await delay(2000);
      const tx = await program.methods
        .claim(configAuthBump, rewardPotBump)
        .accounts({
          user: user.wallet.publicKey,
          userState,
          config: config.publicKey,
          configAuthority: configAuth,
          rewardDestination: userATA,
          rewardMint: mint.publicKey,
          rewardPot: rewardPot,

          // programs
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([user.keypair])
        .rpc();

      console.log("tx", tx);

      const finalRewardPotBalance = await getTokenBalanceByATA(
        user.provider.connection,
        rewardPot
      );
      console.log(
        "reward pot token balance (after claim): ",
        finalRewardPotBalance
      );

      const finalUserTokenBalance = await getTokenBalanceByATA(
        user.provider.connection,
        userATA
      );
      console.log("user token balance (after claim): ", finalUserTokenBalance);

      assert.ok(finalUserTokenBalance > 0, "user got the reward");
      assert.equal(
        earlyRewardPotBalance - finalUserTokenBalance,
        finalRewardPotBalance,
        "reward pot reduced by reward amount"
      );
    });
  });
});
