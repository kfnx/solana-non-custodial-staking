import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { clusterApiUrl, Connection, Keypair, ParsedAccountData, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { NcStaking } from "./target/types/nc_staking";

const connection = new Connection(clusterApiUrl('devnet'));
const run = async () => {
  const pai = await connection.getParsedAccountInfo(new PublicKey("BE9eZ6WSzKekD4pEgkoi3vud1BN1SjgrfsEe8DMQr5Hs"))
  console.log(pai);
  const parsed = <ParsedAccountData>pai.value.data;
  console.log(parsed);
};

run();

