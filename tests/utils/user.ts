import * as anchor from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";

export interface User {
  keypair: Keypair;
  wallet: anchor.Wallet;
  provider: anchor.AnchorProvider;
  state: any;
}

/**
 * Give user anchor compatible wallet, keypair and provider
 * @param connection
 * @param keypair
 * @param providerOpts
 * @returns
 */
export function createUser(
  connection: Connection = anchor.AnchorProvider.env().connection,
  keypair: Keypair = Keypair.generate(),
  providerOpts = anchor.AnchorProvider.defaultOptions()
): User {
  let wallet = new anchor.Wallet(keypair);
  let provider = new anchor.AnchorProvider(connection, wallet, providerOpts);

  return {
    keypair,
    wallet,
    provider,
    state: {},
  };
}

export async function airdropUser(
  publicKey: PublicKey,
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

/**
 * Give program with signers built in
 * @param program
 * @param user
 * @returns
 */
export function programForUser(
  program: { idl: anchor.Idl; programId: anchor.Address },
  user: { provider: anchor.Provider }
) {
  return new anchor.Program(program.idl, program.programId, user.provider);
}

export async function userToken(
  connection: Connection,
  publicKey: PublicKey,
  mint: PublicKey
): Promise<[PublicKey, number]> {
  try {
    const getTokenAccount = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      {
        mint,
      }
    );

    const account = getTokenAccount.value[0].pubkey;
    // const info = getTokenAccount.value[0].account.data.parsed.info
    const balance =
      getTokenAccount.value[0].account.data.parsed.info.tokenAmount.uiAmount;

    return [account, balance];
  } catch (error) {
    console.error(error);
    return [null, null];
  }
}

export async function getTokenBalanceByATA(
  connection: Connection,
  ata: PublicKey
): Promise<number> {
  return (await connection.getTokenAccountBalance(ata)).value.uiAmount;
}
