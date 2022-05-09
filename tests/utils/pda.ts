import * as anchor from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
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

export const findConfigAuthorityPDA = async (
  config: PublicKey,
  programId: PublicKey
) => {
  return PublicKey.findProgramAddress([config.toBytes()], programId);
};

export const findRewardPotPDA = (
  config: PublicKey,
  rewardMint: PublicKey,
  programId: PublicKey
) => {
  return PublicKey.findProgramAddress(
    [Buffer.from("reward_pot"), config.toBytes(), rewardMint.toBytes()],
    programId
  );
};
