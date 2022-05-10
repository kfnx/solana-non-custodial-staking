import { PublicKey } from "@solana/web3.js";

export const findUserStatePDA = async (
  user: PublicKey,
  programId: PublicKey
) => {
  return await PublicKey.findProgramAddress(
    [Buffer.from("user_state"), user.toBytes()],
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
