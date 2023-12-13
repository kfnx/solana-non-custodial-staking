import * as anchor from "@project-serum/anchor";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { createMintToInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";
import {
  airdropUser,
  allSynchronously,
  getSolanaBalance,
  findRewardPotPDA,
} from "./utils";
import { createStakingConfig, createToken } from "./utils/transactions";
import { NcStaking, IDL } from "../target/types/nc_staking";
import { store } from "./0-constants";

/**
 * This script can be used outside test by changing Anchor.toml test to target this file only
 * then run command below with your preferred cluster and wallet:
 * anchor test --provider.cluster localnet --provider.wallet $SOLANA_CONFIG_PATH/id.json --skip-deploy --skip-local-validator --skip-build --skip-lint
 * ⚠️ change all provider and connection according to cluster if you use non-localhost
 */

const checkConfigResult = async (
  program: anchor.Program<NcStaking>,
  admin: Keypair,
  config: Keypair,
  rewardMint: PublicKey,
  creatorWhitelist: PublicKey,
  option: StakingConfigOption
) => {
  const account = await program.account.stakingConfig.fetch(config.publicKey);

  assert.ok(account.admin.equals(admin.publicKey));
  assert.ok(account.rewardMint.equals(rewardMint));
  const { rewardPerSec, rewardDenominator: denominator } = option;
  assert.ok(account.rewardPerSec.toNumber() === rewardPerSec.toNumber());
  assert.ok(account.rewardDenominator.toNumber() === denominator.toNumber());
  assert.ok(account.creatorWhitelist.equals(creatorWhitelist));
};

console.log(anchor.AnchorProvider.env().connection.rpcEndpoint);

describe("Generate staking configs", () => {
  const { dev, rewardToken, configs, NFTcreator, markers } = store;
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

    // give our hacker user sol
    await airdropUser(markers.wallet.publicKey);
  });

  it("Create Configs", async () => {
    const prevTotalConfigs = (await program.account.stakingConfig.all()).length;

    await allSynchronously(
      configs.map((config, index) => async () => {
        try {
          await createStakingConfig(
            program,
            dev,
            config.keypair,
            rewardToken.publicKey,
            NFTcreator.wallet.publicKey,
            config.option
          );
          await checkConfigResult(
            program,
            dev.keypair,
            config.keypair,
            rewardToken.publicKey,
            NFTcreator.wallet.publicKey,
            config.option
          );
          console.log(index, "staking config created");
        } catch (error) {
          console.log(index, "config", error);
        }
      })
    );

    const currentAmount = (await program.account.stakingConfig.all()).length;

    assert.equal(
      currentAmount,
      prevTotalConfigs + configs.length,
      "total created staking config account should be right"
    );
  });

  it("cannot update config reward rate with random key", async () => {
    await allSynchronously(
      configs.map((config) => async () => {
        const configId = config.keypair.publicKey;
        try {
          const tx = await program.methods
            .updateStakingConfig(
              new anchor.BN(2),
              new anchor.BN(2),
              new anchor.BN(5)
            )
            .accounts({
              admin: markers.keypair.publicKey,
              config: configId,
            })
            .signers([markers.keypair])
            .rpc();
        } catch (err) {
          // console.log(err);
          return;
        }
        // if it reaches here there was no error so test has failed
        assert.fail("update config reward rate with hacker key did not error");
      })
    );
  });

  it("can update config reward rate with admin key", async () => {
    await allSynchronously(
      configs.map((config) => async () => {
        const configId = config.keypair.publicKey;
        const newConfigOption: StakingConfigOption = {
          rewardPerSec: new anchor.BN(2),
          rewardDenominator: new anchor.BN(2),
          stakingLockDurationInSec: new anchor.BN(5)
        }
        try {
          const tx = await program.methods
            .updateStakingConfig(
              newConfigOption.rewardPerSec,
              newConfigOption.rewardDenominator,
              newConfigOption.stakingLockDurationInSec,
            )
            .accounts({
              admin: dev.keypair.publicKey,
              config: configId,
            })
            .signers([dev.keypair])
            .rpc();

          await checkConfigResult(
            program,
            dev.keypair,
            config.keypair,
            rewardToken.publicKey,
            NFTcreator.wallet.publicKey,
            newConfigOption
          );
        } catch (err) {
          assert.fail("error encountered");
        }
      })
    );
  });

  it("update config reward rate back to normal with admin key", async () => {
    await allSynchronously(
      configs.map((config) => async () => {
        const configId = config.keypair.publicKey;
        const newConfigOption: StakingConfigOption = {
          rewardPerSec: new anchor.BN(2),
          rewardDenominator: new anchor.BN(2),
          stakingLockDurationInSec: new anchor.BN(5)
        }
        try {
          const tx = await program.methods
            .updateStakingConfig(
              config.option.rewardPerSec,
              config.option.rewardDenominator,
              config.option.stakingLockDurationInSec,
            )
            .accounts({
              admin: dev.keypair.publicKey,
              config: configId,
            })
            .signers([dev.keypair])
            .rpc();

          await checkConfigResult(
            program,
            dev.keypair,
            config.keypair,
            rewardToken.publicKey,
            NFTcreator.wallet.publicKey,
            config.option
          );
        } catch (err) {
          assert.fail("error encountered", err);
        }
      })
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
