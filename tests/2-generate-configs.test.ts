import * as anchor from "@project-serum/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import {
  getMinimumBalanceForRentExemptMint,
  MintLayout,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
} from "@solana/spl-token";
import {
  createUser,
  allSynchronously,
  findConfigAuthorityPDA,
  findRewardPotPDA,
} from "./utils";
import { NcStaking } from "../app/admin/sdk";
import { assert } from "chai";
import { createToken } from "./utils/transaction";

/**
 * to make this work change Anchor.toml test = with this file and run anchor test
 * the command to run for me is `anchor test --provider.wallet $SOLANA_CONFIG_PATH/id.json --skip-deploy --skip-local-validator --skip-build --skip-lint`
 * because i want to run this on top of a running local solana node
 */
const dev = createUser(
  Keypair.fromSecretKey(
    Uint8Array.from(
      // 6s5EfTaCCNQ855n8nTqDHue6XJ3hDaxB2ynj727AmgPt
      [
        46, 153, 255, 163, 58, 223, 86, 187, 209, 167, 46, 176, 18, 225, 156,
        176, 71, 14, 67, 109, 146, 108, 110, 61, 230, 47, 140, 147, 96, 222,
        171, 222, 87, 30, 67, 166, 139, 42, 111, 149, 250, 38, 72, 195, 127,
        111, 117, 250, 132, 207, 86, 106, 250, 33, 178, 119, 200, 158, 134, 82,
        70, 103, 165, 27,
      ]
    )
  )
);

const rewardToken = Keypair.fromSecretKey(
  // rw1s6APBqeaLyTtTVSfh3CVvZ1XiusuEpLsr1y8Dgeq
  Uint8Array.from([
    105, 206, 31, 181, 88, 182, 108, 102, 122, 122, 135, 109, 61, 16, 60, 240,
    138, 99, 24, 85, 10, 73, 110, 185, 188, 203, 93, 148, 48, 98, 127, 209, 12,
    202, 136, 211, 93, 163, 65, 41, 45, 50, 187, 80, 182, 195, 104, 221, 13,
    199, 186, 193, 64, 86, 6, 202, 168, 169, 198, 59, 225, 25, 127, 222,
  ])
);

/**
 *
 * Constants
 * Total seconds in 1 day: 1*24*60*60 = 86400
 * Total seconds in 365 day: 365*24*60*60 = 31536000
 * Total NFT: 10000
 *
 * Fixed time to ease calculation
 * 1 month: 30 day
 * 1 year: 365 day
 *
 * 🌾 Staking Config 1
 * IGS/day: 1
 * IGS/second estimate: 1/86400 ≈ 0.00001157407
 * Total reward for 1 year: 1*365*10000 = 3650000
 * Base rate: 1157407
 * Denominator: 100000000000
 * Locking Duration (day): 0
 * Locking Duration (second): 0
 *
 * 🌾 Staking Config 2
 * IGS/day: 1.25
 * IGS/second estimate: 1.25/86400 ≈ 0.00001808449
 * Total reward for 1 year: 1.25*365*10000 = 4562500
 * Base rate: 1808449
 * Denominator: 100000000000
 * Locking Duration (day): 7
 * Locking Duration (second): 7*86400 = 604800
 *
 * 🌾 Staking Config 3
 * IGS/day: 2
 * IGS/second estimate: 2/86400 ≈  0.00002314814
 * Total reward for 1 year: 2*365*10000 = 7300000
 * Base Rate: 2314814
 * Denominator: 100000000000
 * Locking Duration (day): 30
 * Locking Duration (second): 30*86400 = 2592000
 *
 * 🌾 Staking Config 4
 * IGS/day: 2.5
 * IGS/second estimate: 2.5/86400 ≈  0.00002893518
 * Total reward for 1 year: 2.5*365*10000 = 9125000
 * Base Rate: 2893518
 * Denominator: 100000000000
 * Locking Duration (day): 60
 * Locking Duration (second): 60*86400 = 5184000
 *
 * 🌾 Staking Config 5
 * IGS/day: 3
 * IGS/second estimate: 3/(86400) ≈  0.00003472222
 * Total reward for 1 year: 3*365*10000 = 10950000
 * Base Rate: 3472222
 * Denominator: 100000000000
 * Locking Duration (day): 90
 * Locking Duration (second): 90*86400 = 7776000
 *
 *
 * 🏦 Reserved token needed to be pre-minted and fund all farms for 365 days
 * Staking Config 1 = 3650000
 * Staking Config 2 = 4562500
 * Staking Config 3 = 7300000
 * Staking Config 4 = 9125000
 * Staking Config 5 = 10950000
 * Total  = 35_587_500
 *
 */

const configs: StakingConfigArgs[] = [
  {
    rewardTokenMintId: rewardToken.publicKey,
    rewardRate: 1,
    minStakingDurationInSec: 0,
    keypair: Keypair.fromSecretKey(
      // sc1B2RFctpCyFchTv3tmNAcCNuhNwojQFtx7NgSSUXN;
      Uint8Array.from([
        116, 42, 138, 155, 37, 2, 231, 209, 37, 141, 171, 188, 72, 140, 226,
        149, 115, 91, 70, 57, 96, 108, 120, 129, 44, 125, 93, 155, 205, 213,
        105, 189, 12, 246, 158, 82, 177, 229, 211, 177, 175, 171, 92, 148, 133,
        118, 185, 5, 8, 14, 80, 202, 8, 69, 106, 70, 206, 58, 36, 249, 34, 216,
        224, 197,
      ])
    ),
  },
  {
    rewardTokenMintId: rewardToken.publicKey,
    rewardRate: 1,
    minStakingDurationInSec: 60,
    keypair: Keypair.fromSecretKey(
      // sc2VLzGNJK4QeqfVTp1wkvpfKgK6kWAnSrd4uhFVB5T;
      Uint8Array.from([
        9, 26, 225, 222, 85, 154, 241, 92, 222, 202, 216, 249, 3, 21, 41, 71,
        42, 152, 18, 53, 20, 124, 205, 95, 105, 61, 177, 40, 177, 162, 237, 250,
        12, 246, 164, 227, 221, 196, 51, 101, 31, 159, 103, 28, 229, 39, 127,
        13, 147, 255, 41, 143, 117, 232, 121, 178, 6, 185, 112, 25, 185, 210,
        119, 42,
      ])
    ),
  },
  {
    rewardTokenMintId: rewardToken.publicKey,
    rewardRate: 1,
    minStakingDurationInSec: 120,
    keypair: Keypair.fromSecretKey(
      // sc3j8siipRaBZgAdtC2Virp93L9eQeGXBjpHKRULsKP;
      Uint8Array.from([
        189, 4, 119, 255, 28, 121, 181, 191, 251, 175, 166, 123, 153, 146, 76,
        78, 83, 71, 174, 251, 106, 140, 222, 11, 55, 6, 70, 154, 147, 199, 229,
        155, 12, 246, 171, 17, 69, 250, 28, 235, 244, 49, 10, 193, 172, 55, 106,
        66, 227, 54, 252, 198, 195, 171, 173, 134, 215, 173, 102, 55, 252, 142,
        193, 90,
      ])
    ),
  },
  {
    rewardTokenMintId: rewardToken.publicKey,
    rewardRate: 1,
    minStakingDurationInSec: 604800,
    keypair: Keypair.fromSecretKey(
      // sc4iq8PqXqjWF8sG6PguMxkGvUWfVnyoGc2YP4LLEaS
      Uint8Array.from([
        41, 115, 56, 28, 69, 130, 35, 143, 1, 8, 19, 68, 144, 194, 34, 72, 0,
        119, 161, 2, 146, 216, 158, 171, 244, 40, 191, 219, 139, 33, 100, 232,
        12, 246, 176, 8, 38, 121, 143, 186, 192, 156, 145, 86, 213, 183, 74,
        188, 32, 211, 193, 184, 35, 24, 213, 237, 68, 36, 125, 45, 43, 224, 102,
        111,
      ])
    ),
  },
  {
    rewardTokenMintId: rewardToken.publicKey,
    rewardRate: 1,
    minStakingDurationInSec: 7776000,
    keypair: Keypair.fromSecretKey(
      // sc5yvCo9RovPfgZDxCexfJysnPYKTzMm6cWEcSz7Nco
      Uint8Array.from([
        249, 74, 217, 129, 124, 37, 68, 103, 130, 254, 171, 126, 168, 105, 254,
        98, 180, 133, 20, 187, 86, 156, 165, 212, 16, 148, 206, 71, 230, 28, 68,
        8, 12, 246, 182, 82, 29, 6, 109, 157, 151, 98, 49, 126, 223, 47, 43,
        167, 107, 203, 171, 186, 146, 11, 158, 51, 4, 167, 84, 49, 229, 128, 0,
        112,
      ])
    ),
  },
];

interface StakingConfigArgs {
  keypair: Keypair;
  rewardRate: number;
  minStakingDurationInSec: number;
  rewardTokenMintId: PublicKey;
}

const createStakingConfig = async (
  creator: Keypair,
  config: StakingConfigArgs
) => {
  // console.log("config", config.publicKey.toBase58());
  const [configAuth, configAuthBump] = await findConfigAuthorityPDA(
    config.keypair.publicKey
  );
  // console.log("configAuth", configAuth.toBase58());

  const [rewardPot] = await findRewardPotPDA(
    config.keypair.publicKey,
    config.rewardTokenMintId
  );
  // console.log("reward pot", rewardPot.toBase58());

  // init staking config
  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
  const initStakingTx = await program.methods
    .initStakingConfig(
      configAuthBump,
      new anchor.BN(config.rewardRate),
      new anchor.BN(config.minStakingDurationInSec)
    )
    .accounts({
      admin: creator.publicKey,
      config: config.keypair.publicKey,
      configAuthority: configAuth,
      rewardMint: config.rewardTokenMintId,
      rewardPot,
      creatorAddressToWhitelist: creator.publicKey,
      // programs
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([creator, config.keypair])
    .rpc();
  console.log("init config tx", initStakingTx);
};

const checkConfigResult = async (
  creator: Keypair,
  config: StakingConfigArgs
) => {
  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;

  const account = await program.account.stakingConfig.fetch(
    config.keypair.publicKey
  );

  assert.ok(account.admin.equals(creator.publicKey));
  assert.ok(account.rewardMint.equals(config.rewardTokenMintId));
  assert.ok(account.rewardRate.toNumber() === config.rewardRate);
  assert.equal(
    account.creatorWhitelist.toBase58(),
    creator.publicKey.toBase58(),
    "config whitelist is the dev address as creator address"
  );
};

describe("Generate staking configs", () => {
  console.log("Dev/admin address", dev.wallet.publicKey.toBase58());
  console.log("rewardToken address", rewardToken.publicKey.toBase58());
  it("Create token", async () => {
    await createToken(dev.keypair, rewardToken);
  });

  it("Create Configs", async () => {
    const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
    const prevTotalConfigs = (await program.account.stakingConfig.all()).length;

    await allSynchronously(
      configs.map((config) => async () => {
        await createStakingConfig(dev.keypair, config);
        await checkConfigResult(dev.keypair, config);
      })
    );

    const currentAmount = (await program.account.stakingConfig.all()).length;

    assert.equal(
      currentAmount,
      prevTotalConfigs + configs.length,
      "total created staking config account should be right"
    );
  });
});
