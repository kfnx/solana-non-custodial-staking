import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import * as anchor from "@project-serum/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import {
  getSolanaBalance,
  createUser,
  findUserATA,
  getTokenBalanceByATA,
} from "./utils/user";
import { adminUnstake, getStakingConfig, updateStakingConfig } from "./utils/transactions";
import { IDL, NcStaking } from "../target/types/nc_staking";
import { delay } from "./utils";

chai.use(chaiAsPromised);

console.log(
  "anchor env",
  anchor.AnchorProvider.env().connection.rpcEndpoint,
  anchor.AnchorProvider.env().wallet.publicKey.toBase58()
);
// ADMIN TWMtQV3hzKLRpDy67QPcEqkFc6r8vAwxx5UvQ3fkjh5
const MAINNET_CONFIGS = [
  "62nhMVwrQQHp8cBm4G9H5xFW8dU2k7NukoUuGxxKVumq", //90days
  "HYUS4qdk2f52Y57zJAPCjwNN1aw2iDwLkzyVL99Mam6d", //60days
  "7tSzPraX6gUhJ5Fqc3t49CHLKbhpkuVUc49qEyM4FG7z", //30days
  "HGfsB83DVkcScAnNtoFTLEte42iFGZwNUbosevPYTKhf", //7days
  "Ceby7eP3WRfLVByz3Ujv13phgvQHWH6G63XNeUUJb6Xr", //flexible
];
describe("Update Staking Config", () => {
  /**
   * Update constants below before running this script
   */
  // Mainnet TWMtQV3hzKLRpDy67QPcEqkFc6r8vAwxx5UvQ3fkjh5
  // Devnet 6s5EfTaCCNQ855n8nTqDHue6XJ3hDaxB2ynj727AmgPt
  const ADMIN_KEYPAIR = Keypair.fromSecretKey(
    Uint8Array.from(
      // THIS is dummy keypair, please update before running the script
      []
    )
  );

  const CONFIG = new PublicKey(MAINNET_CONFIGS[0]);

  const CONNECTION = new Connection(
    "https://bitter-twilight-night.solana-mainnet.discover.quiknode.pro/c0d5a9290c79e2a87e32cc3e6406d952c8ec2cd5"
  );
  const PROGRAM_ID = new PublicKey(
    "stakEUMMv9bRHYX4CyVY48i19ViBdNSzn8Rt1a1Fi6E"
  );

  console.log("RUNNING CONFIG UPDATE");
  console.log("CONNECTION", CONNECTION.rpcEndpoint);
  console.log("PROGRAM_ID", PROGRAM_ID.toBase58());
  console.log("ADMIN_KEYPAIR", ADMIN_KEYPAIR.publicKey.toBase58());
  console.log("CONFIG_OF_THE_NFT", CONFIG.toBase58());

  it("starts", async () => {
    const admin = createUser(ADMIN_KEYPAIR, CONNECTION);

    const program = new anchor.Program<NcStaking>(
      IDL,
      PROGRAM_ID,
      admin.provider
    );

    // check before unstake
    const balance0 = await getSolanaBalance(admin.wallet.publicKey, CONNECTION);
    const configStateBefore = await getStakingConfig(program, CONFIG);
    console.log("configStateBefore", configStateBefore);
    const tx = await updateStakingConfig(program, admin, CONFIG, {
      rewardPerSec: new anchor.BN(0),
      rewardDenominator: new anchor.BN(0),
      stakingLockDurationInSec: new anchor.BN(0),
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
