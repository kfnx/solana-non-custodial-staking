import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { programs } from "@metaplex/js";
import { NcStaking } from "../../target/types/nc_staking";
import { TOKEN_METADATA_PROGRAM_ID } from "./program-id";

// const { programId: PROGRAM_ID } = anchor.workspace
//   .NcStaking as anchor.Program<NcStaking>;

export const findUserStatePDA = async (
  user: PublicKey,
  config: PublicKey,
  programId?: PublicKey
) => {
  return await PublicKey.findProgramAddress(
    [Buffer.from("user_state"), config.toBytes(), user.toBytes()],
    programId
  );
};

export const findDelegateAuthPDA = async (
  tokenAccount: PublicKey,
  programId?: PublicKey
) => {
  return await PublicKey.findProgramAddress(
    [Buffer.from("delegate"), tokenAccount.toBytes()],
    programId
  );
};

export const findConfigAuthorityPDA = async (
  config: PublicKey,
  programId?: PublicKey
) => {
  return PublicKey.findProgramAddress(
    [Buffer.from("config"), config.toBytes()],
    programId
  );
};

export const findRewardPotPDA = (
  config: PublicKey,
  rewardMint: PublicKey,
  programId?: PublicKey
) => {
  return PublicKey.findProgramAddress(
    [Buffer.from("reward_pot"), config.toBytes(), rewardMint.toBytes()],
    programId
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

export const findStakeInfoPDA = async (
  user: PublicKey,
  mint: PublicKey,
  programId?: PublicKey
) => {
  return PublicKey.findProgramAddress(
    [Buffer.from("stake_info"), user.toBytes(), mint.toBytes()],
    programId
  );
};
