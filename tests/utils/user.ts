import * as anchor from "@project-serum/anchor";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

export type User = {
  keypair: anchor.web3.Keypair;
  wallet: anchor.Wallet;
  provider: anchor.AnchorProvider;
};

export async function createUser(
  provider: anchor.AnchorProvider,
  keypair?: Keypair,
  airdropBalance?: number
): Promise<User> {
  airdropBalance = airdropBalance ?? 1 * LAMPORTS_PER_SOL;
  keypair ?? anchor.web3.Keypair.generate();
  let sig = await provider.connection.requestAirdrop(
    keypair.publicKey,
    airdropBalance
  );
  await provider.connection.confirmTransaction(sig);

  let wallet = new anchor.Wallet(keypair);
  let userProvider = new anchor.AnchorProvider(
    provider.connection,
    wallet,
    provider.opts
  );

  return {
    keypair,
    wallet,
    provider: userProvider,
  };
}

export function createUsers(
  provider: anchor.AnchorProvider,
  airdropBalance = 1 * LAMPORTS_PER_SOL,
  numUsers: number
) {
  let promises = [];
  for (let i = 0; i < numUsers; i++) {
    promises.push(createUser(provider, undefined, airdropBalance));
  }

  return Promise.all(promises);
}

export function programForUser(
  program: { idl: anchor.Idl; programId: anchor.Address },
  user: { provider: anchor.Provider }
) {
  return new anchor.Program(program.idl, program.programId, user.provider);
}
