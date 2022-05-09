import { assert } from "chai";
import * as anchor from "@project-serum/anchor";
import { NcStaking } from "../target/types/nc_staking";
import {
  airdropUser,
  createUser,
  findUserATA,
  getTokenBalanceByATA,
} from "./utils/user";
import {
  findConfigAuthorityPDA,
  findRewardPotPDA,
} from "./utils/pda";
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

describe("Claiming staking token reward", () => {
  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
  const config = Keypair.generate();
  const mint = Keypair.generate();
  const admin = createUser();
  const user = createUser();
  const programId = program.programId;

  console.log("programId", programId.toBase58());
  console.log("config", config.publicKey.toBase58());
  console.log("mint", mint.publicKey.toBase58());
  console.log("admin", admin.wallet.publicKey.toBase58());
  console.log("user", user.wallet.publicKey.toBase58());

  describe("claim user journey", () => {
    it("setup accounts", async () => {
      await airdropUser(user.wallet.publicKey);
      await airdropUser(admin.wallet.publicKey);
    });

    it("admin/dev create mint and init config instruction", async () => {
      // create token for reward
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
      const init_staking_tx = await program.methods
        .initStakingConfig(configAuthBump)
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
      console.log("init config tx", init_staking_tx);

      // fund reward pot
      const mint_tokens_to_reward_pot_tx = new Transaction({
        feePayer: admin.wallet.publicKey,
      });
      const mint_amount = 2_000_000;
      mint_tokens_to_reward_pot_tx.add(
        createMintToInstruction(
          mint.publicKey, // mint
          rewardPot, // receiver (sholud be a token account)
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
        rewardPot
      );
      console.log("funded reward pot token balance: ", rewardPotBalance);

      assert.equal(mint_amount, rewardPotBalance, "reward pot funded");

      const allStakingAccounts = await program.account.stakingConfig.all();
      // console.log("allStakingAccounts", allStakingAccounts[0]);

      assert.equal(allStakingAccounts.length, 1, "there should be 1 staking config account");
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

      console.log("userATA", userATA.toBase58());
      const tx = await program.methods
        .claim(configAuthBump, rewardPotBump)
        .accounts({
          user: user.wallet.publicKey,
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
      const reward = 1_000_000;

      assert.equal(reward, finalUserTokenBalance, "user got the reward");
      assert.equal(earlyRewardPotBalance - reward, finalRewardPotBalance, "reward pot reduced by reward amount");
    });
  });
});
