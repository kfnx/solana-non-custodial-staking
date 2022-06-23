import * as anchor from "@project-serum/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import { createMintToInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";
import {
  airdropUser,
  allSynchronously,
  getSolanaBalance,
  findConfigAuthorityPDA,
  findRewardPotPDA,
} from "./utils";
import { createToken } from "./utils/transaction";
import { NcStaking, IDL } from "../target/types/nc_staking";
import { StakingConfigOption, store } from "./0-constants";

/**
 * This script can be used outside test by changing Anchor.toml test to target this file only
 * then run command below with your preferred cluster and wallet:
 * anchor test --provider.cluster localnet --provider.wallet $SOLANA_CONFIG_PATH/id.json --skip-deploy --skip-local-validator --skip-build --skip-lint
 * ⚠️ change all provider and connection according to cluster if you use non-localhost
 */

const createStakingConfig = async (
  creator: Keypair,
  config: Keypair,
  rewardMint: PublicKey,
  option: StakingConfigOption,
  program: anchor.Program<NcStaking> = anchor.workspace
    .NcStaking as anchor.Program<NcStaking>
) => {
  // console.log("config", config.publicKey.toBase58());
  const [configAuth, configAuthBump] = await findConfigAuthorityPDA(
    config.publicKey
  );
  // console.log("configAuth", configAuth.toBase58());
  const [rewardPot] = await findRewardPotPDA(config.publicKey, rewardMint);
  // console.log("reward pot", rewardPot.toBase58());
  const initStakingTx = await program.methods
    .initStakingConfig(
      configAuthBump,
      option.rewardPerSec,
      option.rewardDenominator,
      option.stakingLockDurationInSec
    )
    .accounts({
      admin: creator.publicKey,
      config: config.publicKey,
      configAuthority: configAuth,
      rewardMint,
      rewardPot,
      creatorAddressToWhitelist: creator.publicKey,
      // programs
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([creator, config])
    .rpc();
  console.log("init config tx", initStakingTx);
};

const checkConfigResult = async (
  creator: Keypair,
  config: Keypair,
  rewardMint: PublicKey,
  option: StakingConfigOption,
  program: anchor.Program<NcStaking> = anchor.workspace
    .NcStaking as anchor.Program<NcStaking>
) => {
  const account = await program.account.stakingConfig.fetch(config.publicKey);

  assert.ok(account.admin.equals(creator.publicKey));
  assert.ok(account.rewardMint.equals(rewardMint));
  const { rewardPerSec, rewardDenominator: denominator } = option;
  assert.ok(account.rewardPerSec.toNumber() === rewardPerSec.toNumber());
  assert.ok(account.rewardDenominator.toNumber() === denominator.toNumber());
  assert.ok(account.creatorWhitelist.equals(creator.publicKey));
};

console.log(anchor.AnchorProvider.env().connection.rpcEndpoint);

describe("Generate staking configs", () => {
  const { dev, rewardToken, configs } = store;
  const anchorProgram = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
  const program = new anchor.Program(
    IDL,
    anchorProgram.programId,
    dev.provider
  );

  it("Create token", async () => {
    await airdropUser(dev.wallet.publicKey);
    console.log(
      "Dev/admin address",
      dev.wallet.publicKey.toBase58(),
      "balance",
      await getSolanaBalance(dev.wallet.publicKey)
    );
    await createToken(dev.keypair, rewardToken, dev.provider);
    console.log("rewardToken address", rewardToken.publicKey.toBase58());
  });

  it("Create Configs", async () => {
    const prevTotalConfigs = (await program.account.stakingConfig.all()).length;

    await allSynchronously(
      configs.map((config) => async () => {
        await createStakingConfig(
          dev.keypair,
          config.keypair,
          rewardToken.publicKey,
          config.option,
          program
        );
        await checkConfigResult(
          dev.keypair,
          config.keypair,
          rewardToken.publicKey,
          config.option,
          program
        );
      })
    );

    const currentAmount = (await program.account.stakingConfig.all()).length;

    assert.equal(
      currentAmount,
      prevTotalConfigs + configs.length,
      "total created staking config account should be right"
    );
  });

  it("Fund config reward pot so user can claim token rewards", async () => {
    await allSynchronously(
      configs.map((config) => async () => {
        const configId = config.keypair.publicKey;
        const [rewardPotATA] = await findRewardPotPDA(
          configId,
          rewardToken.publicKey
        );
        const mintTx = new Transaction({
          feePayer: dev.wallet.publicKey,
        });
        const mint_amount = 10_000_000;
        mintTx.add(
          createMintToInstruction(
            rewardToken.publicKey, // mint
            rewardPotATA, // receiver (sholud be a token account)
            dev.wallet.publicKey, // mint authority
            mint_amount, // amount. if your decimals is 8, you mint 10^8 for 1 token.
            [], // only multisig account will use. leave it empty now.
            TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
          )
        );

        const tx = await dev.provider.sendAndConfirm(mintTx);
        // console.log("fund reward token tx", tx);
      })
    );
  });
});
