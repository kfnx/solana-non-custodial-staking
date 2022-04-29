import * as anchor from "@project-serum/anchor";
import { Wallet } from "@project-serum/anchor/dist/cjs/provider";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export type User = {
  keypair: anchor.web3.Keypair;
  wallet: anchor.Wallet;
  provider: anchor.AnchorProvider;
};

export async function createUser(
  provider: anchor.AnchorProvider,
  airdropBalance: number
): Promise<User> {
  airdropBalance = airdropBalance ?? 10 * LAMPORTS_PER_SOL;
  let user = anchor.web3.Keypair.generate();
  let sig = await provider.connection.requestAirdrop(
    user.publicKey,
    airdropBalance
  );
  await provider.connection.confirmTransaction(sig);

  let wallet = new anchor.Wallet(user);
  let userProvider = new anchor.AnchorProvider(
    provider.connection,
    wallet,
    provider.opts
  );

  return {
    keypair: user,
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
    promises.push(createUser(provider, airdropBalance));
  }

  return Promise.all(promises);
}

export function programForUser(
  program: { idl: anchor.Idl; programId: anchor.Address },
  user: { provider: anchor.Provider }
) {
  return new anchor.Program(program.idl, program.programId, user.provider);
}

export async function pause(ms: number) {
  await new Promise((response) =>
    setTimeout(() => {
      response(0);
    }, ms)
  );
}

export async function findVaultPDA(
  user: Wallet | anchor.web3.Keypair,
  programId: anchor.web3.PublicKey
) {
  return await PublicKey.findProgramAddress(
    [Buffer.from("vault"), user.publicKey.toBytes()],
    programId
  );
}
