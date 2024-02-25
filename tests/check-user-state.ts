import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { IDL, NcStaking } from "../target/types/nc_staking";

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
const CONFIG_TO_CHECK = "Ceby7eP3WRfLVByz3Ujv13phgvQHWH6G63XNeUUJb6Xr";
describe("Load all user states", () => {
  const CONFIG = new PublicKey(CONFIG_TO_CHECK);
  const PROGRAM_ID = new PublicKey(
    "stakEUMMv9bRHYX4CyVY48i19ViBdNSzn8Rt1a1Fi6E"
  );
  const CONNECTION = anchor.AnchorProvider.env().connection;
  console.log("CONNECTION", CONNECTION.rpcEndpoint);
  console.log("PROGRAM_ID", PROGRAM_ID.toBase58());
  console.log("CONFIG_OF_THE_NFT", CONFIG.toBase58());

  it("starts", async () => {
    const program = new anchor.Program<NcStaking>(
      IDL,
      PROGRAM_ID,
      anchor.AnchorProvider.env()
    );

    const allUserStates = await program.account.userV2.all([{memcmp: {
      /** offset into program account data to start comparison */
      offset: 8+32, // discriminator + user
      /** data to match, as base-58 encoded string and limited to less than 129 bytes */
      bytes: CONFIG_TO_CHECK,
    }}]);

    console.log(allUserStates);
    
  });
});
