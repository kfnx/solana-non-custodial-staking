import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import * as anchor from "@project-serum/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getSolanaBalance, createUser } from "./utils/user";
import { getStakingConfig, updateStakingConfig } from "./utils/transactions";
import { IDL, NcStaking } from "../target/types/nc_staking";
import { delay } from "./utils";

chai.use(chaiAsPromised);

console.log("anchor env: update the Anchor.toml if this is incorrect");
console.log("rpc:", anchor.AnchorProvider.env().connection.rpcEndpoint);
// ADMIN TWMtQV3hzKLRpDy67QPcEqkFc6r8vAwxx5UvQ3fkjh5
const MAINNET_CONFIGS = [
  "62nhMVwrQQHp8cBm4G9H5xFW8dU2k7NukoUuGxxKVumq", //90days
  "HYUS4qdk2f52Y57zJAPCjwNN1aw2iDwLkzyVL99Mam6d", //60days
  "7tSzPraX6gUhJ5Fqc3t49CHLKbhpkuVUc49qEyM4FG7z", //30days
  "HGfsB83DVkcScAnNtoFTLEte42iFGZwNUbosevPYTKhf", //7days
  "Ceby7eP3WRfLVByz3Ujv13phgvQHWH6G63XNeUUJb6Xr", //flexible
];
const CONFIG_TO_UPDATE = "Ceby7eP3WRfLVByz3Ujv13phgvQHWH6G63XNeUUJb6Xr";
const REWARD_PER_SEC = new anchor.BN(1157407);
const REWARD_DENOMINATOR = new anchor.BN(100000000000);
const STAKING_LOCK_DURATION_IN_SEC = new anchor.BN(60);
describe("Update Staking Config", () => {
  /**
   * Update constants below before running this script
   */
  // Mainnet TWMtQV3hzKLRpDy67QPcEqkFc6r8vAwxx5UvQ3fkjh5
  const ADMIN_KEYPAIR = Keypair.fromSecretKey(
    Uint8Array.from(
      // THIS is dummy keypair, please update before running the script
      [
      ]
    )
  );

  const CONFIG = new PublicKey(CONFIG_TO_UPDATE);
  const PROGRAM_ID = new PublicKey(
    "stakEUMMv9bRHYX4CyVY48i19ViBdNSzn8Rt1a1Fi6E"
  );
  const CONNECTION = anchor.AnchorProvider.env().connection;
  console.log("RUNNING CONFIG UPDATE");
  console.log("CONNECTION", CONNECTION.rpcEndpoint);
  console.log("PROGRAM_ID", PROGRAM_ID.toBase58());
  console.log("ADMIN_KEYPAIR", ADMIN_KEYPAIR.publicKey.toBase58());
  console.log("CONFIG_OF_THE_NFT", CONFIG.toBase58());

  console.log("REWARD_PER_SEC", REWARD_PER_SEC);
  console.log("REWARD_DENOMINATOR", REWARD_DENOMINATOR);
  console.log("STAKING_LOCK_DURATION_IN_SEC", STAKING_LOCK_DURATION_IN_SEC);
  it("starts", async () => {
    const admin = createUser(ADMIN_KEYPAIR, CONNECTION);
    const program = new anchor.Program<NcStaking>(
      IDL,
      PROGRAM_ID,
      anchor.AnchorProvider.env()
    );

    // check before unstake
    const balance0 = await getSolanaBalance(admin.wallet.publicKey, CONNECTION);
    const configStateBefore = await getStakingConfig(program, CONFIG);
    console.log("configStateBefore", configStateBefore);
    const tx = await updateStakingConfig(program, admin, CONFIG, {
      rewardPerSec: REWARD_PER_SEC,
      rewardDenominator: REWARD_DENOMINATOR,
      stakingLockDurationInSec: STAKING_LOCK_DURATION_IN_SEC,
    });
    console.log("updateStakingConfig tx", tx);
    console.log(
      "wait for 30s for the changes to be implemented in blockchain.."
    );
    await delay(30000);
    const balance1 = await getSolanaBalance(admin.wallet.publicKey, CONNECTION);
    console.log("admin balance before:", balance0, "after:", balance1);
    const configStateAfter = await getStakingConfig(program, CONFIG);
    console.log("configStateAfter", configStateAfter);
  });
});
