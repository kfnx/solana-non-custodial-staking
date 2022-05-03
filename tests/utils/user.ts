import * as anchor from "@project-serum/anchor";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

export interface User {
  keypair: anchor.web3.Keypair;
  wallet: anchor.Wallet;
  provider: anchor.AnchorProvider;
}

export function createUser(
  connection: Connection = anchor.AnchorProvider.env().connection,
  keypair: Keypair = anchor.web3.Keypair.generate(),
  providerOpts = anchor.AnchorProvider.defaultOptions()
): User {
  let wallet = new anchor.Wallet(keypair);
  let provider = new anchor.AnchorProvider(connection, wallet, providerOpts);

  return {
    keypair,
    wallet,
    provider,
  };
}

export async function airdropUser(
  publicKey: anchor.web3.PublicKey,
  connection: Connection = anchor.AnchorProvider.env().connection,
  airdropBalance: number = 1 * LAMPORTS_PER_SOL
): Promise<void> {
  let sig = await connection.requestAirdrop(publicKey, airdropBalance);
  await connection.confirmTransaction(sig);
}

export function createUsers(connection: Connection, numUsers: number) {
  for (let i = 0; i < numUsers; i++) {
    createUser(connection, undefined);
  }
}

export function createUsersWithAirdrop(
  connection: Connection,
  airdropBalance = 1 * LAMPORTS_PER_SOL,
  numUsers: number
) {
  let promises = [];
  for (let i = 0; i < numUsers; i++) {
    const user = createUser(connection, null);
    const tx = airdropUser(user.keypair.publicKey, connection, airdropBalance);
    promises.push(tx);
  }

  return Promise.all(promises);
}

export function programForUser(
  program: { idl: anchor.Idl; programId: anchor.Address },
  user: { provider: anchor.Provider }
) {
  return new anchor.Program(program.idl, program.programId, user.provider);
}
