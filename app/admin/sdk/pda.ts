import { PublicKey } from "@solana/web3.js";
import { programs } from "@metaplex/js";
import { PROGRAM_ID, TOKEN_METADATA_PROGRAM_ID } from "./programId";

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

export const findMetadataPDA = async (mint: PublicKey) => {
  return await programs.metadata.Metadata.getPDA(mint);
};

export const findStakeInfoPDA = async (user: PublicKey, mint: PublicKey) => {
  return PublicKey.findProgramAddress(
    [Buffer.from("stake_info"), user.toBytes(), mint.toBytes()],
    PROGRAM_ID
  );
};
