import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, TOKEN_METADATA_PROGRAM_ID } from "./programId";
import { programs } from "@metaplex/js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  // @ts-ignore
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export const findUserStatePDA = async (user: PublicKey, config: PublicKey) => {
  return await PublicKey.findProgramAddress(
    [Buffer.from("user_state"), config.toBytes(), user.toBytes()],
    PROGRAM_ID
  );
};

export const findDelegateAuthPDA = async (tokenAccount: PublicKey) => {
  return await PublicKey.findProgramAddress(
    [Buffer.from("delegate"), tokenAccount.toBytes()],
    PROGRAM_ID
  );
};

export const findConfigAuthorityPDA = async (config: PublicKey) => {
  return PublicKey.findProgramAddress(
    [Buffer.from("config"), config.toBytes()],
    PROGRAM_ID
  );
};

export const findRewardPotPDA = (config: PublicKey, rewardMint: PublicKey) => {
  return PublicKey.findProgramAddress(
    [Buffer.from("reward_pot"), config.toBytes(), rewardMint.toBytes()],
    PROGRAM_ID
  );
};

export const findEditionPDA = (mint: PublicKey) => {
  return PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBytes(),
      mint.toBytes(),
      Buffer.from("edition"),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
};

export const findWhitelistPDA = async (
  config: PublicKey,
  creator: PublicKey
) => {
  return PublicKey.findProgramAddress(
    [Buffer.from("whitelist"), config.toBytes(), creator.toBytes()],
    PROGRAM_ID
  );
};

export const findMetadataPDA = async (mint: PublicKey) => {
  return await programs.metadata.Metadata.getPDA(mint);
};

export const findStakeInfoPDA = async (
  mint: PublicKey,
  user: PublicKey,
  config: PublicKey
) => {
  return PublicKey.findProgramAddress(
    [
      Buffer.from("stake_info"),
      mint.toBytes(),
      user.toBytes(),
      config.toBytes(),
    ],
    PROGRAM_ID
  );
};
