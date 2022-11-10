import { PublicKey } from "@solana/web3.js";

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const VAULT_PROGRAM_ID = new PublicKey(
  "vau1zxA2LbssAUEF7Gpw91zMM1LvXrvpzJtmZ58rPsn"
);

export const AUCTION_PROGRAM_ID = new PublicKey(
  "auctxRXPeJoc4817jDhf4HbjnhEcr1cCXenosMhK5R8"
);

export const METAPLEX_PROGRAM_ID = new PublicKey(
  "p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98"
);

export const STAKING_REWARD_ID = new PublicKey(
  "rw1s6APBqeaLyTtTVSfh3CVvZ1XiusuEpLsr1y8Dgeq"
  // "igsvRjB6uyVMGcM9nbWwESxN1eTfVTPiQ1ThoCc8f2g"
);

export const NFT_CREATOR_ID = new PublicKey(
  "cretSiBGE5V7BJXnLsE84GBX5X8jxuSnbBfhAVpwGqU"
  // "crezn94Dr12A1FdEn9heFMq7fv5MAEjtFRtTBBBGqP9"
);

// TODO: move this to store so it sync with address
const address = {
  mainnet: {
    PROGRAM_ID: new PublicKey("stakEUMMv9bRHYX4CyVY48i19ViBdNSzn8Rt1a1Fi6E"),
    STAKING_REWARD_ID: new PublicKey(
      "igsvRjB6uyVMGcM9nbWwESxN1eTfVTPiQ1ThoCc8f2g"
    ),
    NFT_CREATOR_ID: new PublicKey(
      "BWWE1mrYNCZ2rapGiWhrURgqq9P2RHVCHnAeVHRoFsZv"
    ),
  },
  devnet: {
    PROGRAM_ID: new PublicKey("stk4YMX6gbb5EL9T2d2UN4AWrGu2p8PzZCF4JQumAfJ"),
    STAKING_REWARD_ID: new PublicKey(
      "rw1s6APBqeaLyTtTVSfh3CVvZ1XiusuEpLsr1y8Dgeq"
    ),
    NFT_CREATOR_ID: new PublicKey(
      // "crezn94Dr12A1FdEn9heFMq7fv5MAEjtFRtTBBBGqP9"
      "cretSiBGE5V7BJXnLsE84GBX5X8jxuSnbBfhAVpwGqU"
    ),
  },
};

export default address;
