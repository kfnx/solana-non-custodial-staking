import * as anchor from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";

export const findVaultPDA = async (
  user: anchor.Wallet | Keypair,
  programId: PublicKey
) => {
  return await PublicKey.findProgramAddress(
    [Buffer.from("vault"), user.publicKey.toBytes()],
    programId
  );
};

export const findDelegateAuthPDA = async (
  tokenAccount: PublicKey,
  programId: PublicKey
) => {
  return await PublicKey.findProgramAddress(
    [Buffer.from("delegate"), tokenAccount.toBytes()],
    programId
  );
};
