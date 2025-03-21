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
import { adminUnstake } from "./utils/transactions";
import { IDL, NcStaking } from "../target/types/nc_staking";
import { delay } from "./utils";

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
  // Mainnet TWMtQV3hzKLRpDy67QPcEqkFc6r8vAwxx5UvQ3fkjh5
  const ADMIN_KEYPAIR = Keypair.fromSecretKey(
    Uint8Array.from(
      // THIS is dummy keypair, please update before running the script
      // HwToSSqew673tpmGc2VqH4Q6kZJnxHmNZauTud5WoumL
      [
        141, 58, 226, 141, 130, 99, 186, 38, 86, 15, 152, 191, 236, 139, 29, 19,
        115, 176, 159, 145, 188, 210, 203, 64, 37, 188, 89, 4, 145, 255, 180,
        35, 251, 174, 168, 122, 192, 149, 227, 185, 114, 75, 193, 206, 166, 209,
        149, 87, 11, 239, 79, 164, 156, 153, 233, 57, 57, 245, 252, 117, 28, 82,
        178, 219,
      ]    )
  );
  const NFT_OWNER = new PublicKey(
    "2j4R25qomKjYEww1rGMqSBU2eSN9R6aCy6rrXhDQeHze"
  );
  const NFT_TO_UNSTAKE = new PublicKey(
    "HKYSjAdnLzhYEoTU561LJ1Yh7M461swpXGN6ytrsPeb8"
  );
  //can be checked: 3rd signer of the stake instruction
  const CONFIG_OF_THE_NFT = new PublicKey(
    "62nhMVwrQQHp8cBm4G9H5xFW8dU2k7NukoUuGxxKVumq" //90 days
  );
  const CONNECTION = new Connection(
    "https://bitter-twilight-night.solana-mainnet.discover.quiknode.pro/c0d5a9290c79e2a87e32cc3e6406d952c8ec2cd5"
  );
  const PROGRAM_ID = new PublicKey(
    "stakEUMMv9bRHYX4CyVY48i19ViBdNSzn8Rt1a1Fi6E"
  );

  const checkNFT = async (user: PublicKey) =>
    await getTokenBalanceByATA(
      CONNECTION,
      await findUserATA(user, NFT_TO_UNSTAKE)
    );

  console.log("RUNNING ADMIN UNSTAKE");
  console.log("CONNECTION", CONNECTION.rpcEndpoint);
  console.log("PROGRAM_ID", PROGRAM_ID.toBase58());
  console.log("ADMIN_KEYPAIR", ADMIN_KEYPAIR.publicKey.toBase58());
  console.log("NFT_OWNER", NFT_OWNER.toBase58());
  console.log("NFT_TO_UNSTAKE", NFT_TO_UNSTAKE.toBase58());
  console.log("CONFIG_OF_THE_NFT", CONFIG_OF_THE_NFT.toBase58());

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

    // check before unstake
    const balance0 = await getSolanaBalance(admin.wallet.publicKey,CONNECTION);
    console.log("User NFT:", await checkNFT(NFT_OWNER));
    console.log("Admin NFT:", await checkNFT(ADMIN_KEYPAIR.publicKey));

    const unstakeTx = await adminUnstake(
      program,
      NFT_OWNER,
      CONFIG_OF_THE_NFT,
      NFT_TO_UNSTAKE,
      admin.keypair
    );
    console.log("unstake tx", unstakeTx);

    // check after unstake
    console.log(
      "wait for 30s for the changes to be implemented in blockchain.."
    );
    await delay(30000);
    const balance1 = await getSolanaBalance(admin.wallet.publicKey,CONNECTION);
    console.log("admin balance before:", balance0, "after:", balance1);
    console.log("User NFT:", await checkNFT(NFT_OWNER));
    console.log("Admin NFT:", await checkNFT(ADMIN_KEYPAIR.publicKey));
  });
});
