import chai, { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import * as anchor from "@project-serum/anchor";
import {
  Connection,
  Keypair,
  ParsedAccountData,
  PublicKey,
} from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { getSolanaBalance, createUser, findUserATA } from "./utils/user";
import { timeNow } from "./utils/helper";
import { adminUnstake } from "./utils/transactions";
import { IDL, NcStaking } from "../target/types/nc_staking";

chai.use(chaiAsPromised);

/**
 * Configs and NFTs are created on test 1 and 2.
 * Justin as normal and kind user test the NFT project and staking program
 * Admin as project owner
 * Markers as bad user attempt to exploit the program
 * uncomment the logs for debugging
 */
console.log(
  "anchor env",
  anchor.AnchorProvider.env().connection.rpcEndpoint,
  anchor.AnchorProvider.env().wallet.publicKey.toBase58()
);

describe("Admin unstake", () => {
  /**
   * Update constants below before running this script
   */
  const ADMIN_KEYPAIR = Keypair.fromSecretKey(
    // HwT
    Uint8Array.from([
      141, 58, 226, 141, 130, 99, 186, 38, 86, 15, 152, 191, 236, 139, 29, 19,
      115, 176, 159, 145, 188, 210, 203, 64, 37, 188, 89, 4, 145, 255, 180, 35,
      251, 174, 168, 122, 192, 149, 227, 185, 114, 75, 193, 206, 166, 209, 149,
      87, 11, 239, 79, 164, 156, 153, 233, 57, 57, 245, 252, 117, 28, 82, 178,
      219,
    ])
  );
  const NFT_OWNER = new PublicKey(
    "6s5EfTaCCNQ855n8nTqDHue6XJ3hDaxB2ynj727AmgPt"
  );
  const NFT_TO_UNSTAKE = new PublicKey(
    "6Km3nACchn8bhWfx3Ao2J9i54vhnfT2Qsy5bm5ZUs1pa"
  );
  const CONFIG_OF_THE_NFT = new PublicKey(
    "8tWp4jN5fH9tqubcGKBdjWp6gAVS39ayCGnqMzzfnD5m"
  );
  const CONNECTION = new Connection(
    "https://solana-devnet.g.alchemy.com/v2/UhHycdI5YouCZZQkTizOC8pBAF2SX6Ly"
  );
  const PROGRAM_ID = new PublicKey(
    "stk4YMX6gbb5EL9T2d2UN4AWrGu2p8PzZCF4JQumAfJ"
  );
  console.log("\n\n\n");
  console.log("RUNNING ADMIN UNSTAKE");
  console.log("CONNECTION", CONNECTION.rpcEndpoint);
  console.log("PROGRAM_ID", PROGRAM_ID.toBase58());
  console.log("ADMIN_KEYPAIR", ADMIN_KEYPAIR.publicKey.toBase58());
  console.log("NFT_OWNER", NFT_OWNER.toBase58());
  console.log("NFT_TO_UNSTAKE", NFT_TO_UNSTAKE.toBase58());
  console.log("CONFIG_OF_THE_NFT", CONFIG_OF_THE_NFT.toBase58());
  console.log("\n\n\n");

  it("starts", async () => {
    const admin = createUser(ADMIN_KEYPAIR, CONNECTION);
    const ATA = await getOrCreateAssociatedTokenAccount(
      admin.provider.connection,
      admin.wallet.payer,
      NFT_TO_UNSTAKE,
      admin.wallet.publicKey
    );
    console.log("ATA created", ATA.address.toBase58());
    const program = new anchor.Program<NcStaking>(
      IDL,
      PROGRAM_ID,
      admin.provider
    );
    const balance0 = await getSolanaBalance(admin.wallet.publicKey);
    const unstakeTx = await adminUnstake(
      program,
      NFT_OWNER,
      CONFIG_OF_THE_NFT,
      NFT_TO_UNSTAKE,
      admin.keypair
    );
    console.log(timeNow(), "unstake tx", unstakeTx);
    const balance1 = await getSolanaBalance(admin.wallet.publicKey);
    console.log("admin balance before:", balance0, "after:", balance1);
    {
      const ataInfo = await admin.provider.connection.getParsedAccountInfo(
        ATA.address
      );
      const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
      console.log("admin ata", parsed);
    }
    {
      const ata = await findUserATA(NFT_OWNER, NFT_TO_UNSTAKE);
      const ataInfo = await admin.provider.connection.getParsedAccountInfo(ata);
      const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
      console.log("nft owner ata", parsed);
    }
  });
});
