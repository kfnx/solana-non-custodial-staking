import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_METADATA_PROGRAM_ID } from "./program-id";
import { NcStaking } from "../../target/types/nc_staking";

const { programId } = anchor.workspace.NcStaking as anchor.Program<NcStaking>;

export const findUserStatePDA = async (user: PublicKey) => {
  return await PublicKey.findProgramAddress(
    [Buffer.from("user_state"), user.toBytes()],
    programId
  );
};

export const findDelegateAuthPDA = async (tokenAccount: PublicKey) => {
  return await PublicKey.findProgramAddress(
    [Buffer.from("delegate"), tokenAccount.toBytes()],
    programId
  );
};

export const findConfigAuthorityPDA = async (config: PublicKey) => {
  return PublicKey.findProgramAddress(
    [Buffer.from("config"), config.toBytes()],
    programId
  );
};

export const findRewardPotPDA = (config: PublicKey, rewardMint: PublicKey) => {
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
