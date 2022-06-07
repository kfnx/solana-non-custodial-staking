export type NcStaking = {
  version: "0.1.0";
  name: "nc_staking";
  instructions: [
    {
      name: "initStakingConfig";
      accounts: [
        {
          name: "admin";
          isMut: true;
          isSigner: true;
        },
        {
          name: "config";
          isMut: true;
          isSigner: true;
        },
        {
          name: "creatorAddressToWhitelist";
          isMut: false;
          isSigner: false;
        },
        {
          name: "configAuthority";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardPot";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "bumpConfigAuth";
          type: "u8";
        },
        {
          name: "rewardPerSec";
          type: "u64";
        },
        {
          name: "rewardDenominator";
          type: "u64";
        },
        {
          name: "stakingLockDurationInSec";
          type: "u64";
        }
      ];
    },
    {
      name: "initStaking";
      accounts: [
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "config";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userState";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "stake";
      accounts: [
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "userState";
          isMut: true;
          isSigner: false;
        },
        {
          name: "config";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeInfo";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "delegate";
          isMut: false;
          isSigner: false;
        },
        {
          name: "edition";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenMetadataProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "unstake";
      accounts: [
        {
          name: "user";
          isMut: false;
          isSigner: true;
        },
        {
          name: "userState";
          isMut: true;
          isSigner: false;
        },
        {
          name: "config";
          isMut: true;
          isSigner: false;
        },
        {
          name: "stakeInfo";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "delegate";
          isMut: false;
          isSigner: false;
        },
        {
          name: "edition";
          isMut: false;
          isSigner: false;
        },
        {
          name: "mint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenMetadataProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "claim";
      accounts: [
        {
          name: "user";
          isMut: true;
          isSigner: true;
        },
        {
          name: "config";
          isMut: true;
          isSigner: false;
        },
        {
          name: "configAuthority";
          isMut: false;
          isSigner: false;
        },
        {
          name: "userState";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardPot";
          isMut: true;
          isSigner: false;
        },
        {
          name: "rewardMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rewardDestination";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "associatedTokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "bumpConfigAuth";
          type: "u8";
        },
        {
          name: "bumpRewardPot";
          type: "u8";
        }
      ];
    },
    {
      name: "modifyWhitelist";
      accounts: [
        {
          name: "admin";
          isMut: true;
          isSigner: true;
        },
        {
          name: "config";
          isMut: true;
          isSigner: false;
        },
        {
          name: "creatorAddressToWhitelist";
          isMut: false;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "stakeInfo";
      type: {
        kind: "struct";
        fields: [
          {
            name: "config";
            type: "publicKey";
          },
          {
            name: "stakingStartTime";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "stakingConfig";
      type: {
        kind: "struct";
        fields: [
          {
            name: "admin";
            type: "publicKey";
          },
          {
            name: "rewardPot";
            type: "publicKey";
          },
          {
            name: "rewardMint";
            type: "publicKey";
          },
          {
            name: "configAuthority";
            type: "publicKey";
          },
          {
            name: "configAuthoritySeed";
            type: "publicKey";
          },
          {
            name: "configAuthorityBumpSeed";
            type: {
              array: ["u8", 1];
            };
          },
          {
            name: "rewardPerSec";
            type: "u64";
          },
          {
            name: "rewardDenominator";
            type: "u64";
          },
          {
            name: "stakingLockDurationInSec";
            type: "u64";
          },
          {
            name: "rewardAccrued";
            type: "u64";
          },
          {
            name: "nftsStaked";
            type: "u64";
          },
          {
            name: "initiatedUsers";
            type: "u64";
          },
          {
            name: "activeStakers";
            type: "u64";
          },
          {
            name: "creatorWhitelist";
            type: "publicKey";
          }
        ];
      };
    },
    {
      name: "user";
      type: {
        kind: "struct";
        fields: [
          {
            name: "user";
            type: "publicKey";
          },
          {
            name: "config";
            type: "publicKey";
          },
          {
            name: "rewardAccrued";
            type: "u64";
          },
          {
            name: "lastStakeTime";
            type: "u64";
          },
          {
            name: "timeLastClaim";
            type: "u64";
          },
          {
            name: "nftsStaked";
            type: "u64";
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "ArithmeticError";
      msg: "Failed to perform math operation safely";
    },
    {
      code: 6001;
      name: "AnchorSerializationIssue";
      msg: "Anchor serialization issue";
    },
    {
      code: 6002;
      name: "InvalidUserState";
      msg: "Unauthorized, invalid user state PDA";
    },
    {
      code: 6003;
      name: "InvalidStakingConfig";
      msg: "Unauthorized, invalid staking config PDA";
    },
    {
      code: 6004;
      name: "UserNeverStake";
      msg: "Cannot claim, user never stake anything";
    },
    {
      code: 6005;
      name: "EmptyVault";
      msg: "Vault empty, nothing to unstake";
    },
    {
      code: 6006;
      name: "NotWhitelisted";
      msg: "NFT creator address is not present in any of the whitelists";
    },
    {
      code: 6007;
      name: "NotStaked";
      msg: "NFT is not present in any stake proof";
    },
    {
      code: 6008;
      name: "CannotUnstakeYet";
      msg: "NFT is in lock period, cannot unstake yet until it reach minimum staking period";
    }
  ];
};

export const IDL: NcStaking = {
  version: "0.1.0",
  name: "nc_staking",
  instructions: [
    {
      name: "initStakingConfig",
      accounts: [
        {
          name: "admin",
          isMut: true,
          isSigner: true,
        },
        {
          name: "config",
          isMut: true,
          isSigner: true,
        },
        {
          name: "creatorAddressToWhitelist",
          isMut: false,
          isSigner: false,
        },
        {
          name: "configAuthority",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardPot",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "bumpConfigAuth",
          type: "u8",
        },
        {
          name: "rewardPerSec",
          type: "u64",
        },
        {
          name: "rewardDenominator",
          type: "u64",
        },
        {
          name: "stakingLockDurationInSec",
          type: "u64",
        },
      ],
    },
    {
      name: "initStaking",
      accounts: [
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "config",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userState",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "stake",
      accounts: [
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "userState",
          isMut: true,
          isSigner: false,
        },
        {
          name: "config",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeInfo",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "delegate",
          isMut: false,
          isSigner: false,
        },
        {
          name: "edition",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenMetadataProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "unstake",
      accounts: [
        {
          name: "user",
          isMut: false,
          isSigner: true,
        },
        {
          name: "userState",
          isMut: true,
          isSigner: false,
        },
        {
          name: "config",
          isMut: true,
          isSigner: false,
        },
        {
          name: "stakeInfo",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "delegate",
          isMut: false,
          isSigner: false,
        },
        {
          name: "edition",
          isMut: false,
          isSigner: false,
        },
        {
          name: "mint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenMetadataProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "claim",
      accounts: [
        {
          name: "user",
          isMut: true,
          isSigner: true,
        },
        {
          name: "config",
          isMut: true,
          isSigner: false,
        },
        {
          name: "configAuthority",
          isMut: false,
          isSigner: false,
        },
        {
          name: "userState",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardPot",
          isMut: true,
          isSigner: false,
        },
        {
          name: "rewardMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rewardDestination",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "associatedTokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "bumpConfigAuth",
          type: "u8",
        },
        {
          name: "bumpRewardPot",
          type: "u8",
        },
      ],
    },
    {
      name: "modifyWhitelist",
      accounts: [
        {
          name: "admin",
          isMut: true,
          isSigner: true,
        },
        {
          name: "config",
          isMut: true,
          isSigner: false,
        },
        {
          name: "creatorAddressToWhitelist",
          isMut: false,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "stakeInfo",
      type: {
        kind: "struct",
        fields: [
          {
            name: "config",
            type: "publicKey",
          },
          {
            name: "stakingStartTime",
            type: "u64",
          },
        ],
      },
    },
    {
      name: "stakingConfig",
      type: {
        kind: "struct",
        fields: [
          {
            name: "admin",
            type: "publicKey",
          },
          {
            name: "rewardPot",
            type: "publicKey",
          },
          {
            name: "rewardMint",
            type: "publicKey",
          },
          {
            name: "configAuthority",
            type: "publicKey",
          },
          {
            name: "configAuthoritySeed",
            type: "publicKey",
          },
          {
            name: "configAuthorityBumpSeed",
            type: {
              array: ["u8", 1],
            },
          },
          {
            name: "rewardPerSec",
            type: "u64",
          },
          {
            name: "rewardDenominator",
            type: "u64",
          },
          {
            name: "stakingLockDurationInSec",
            type: "u64",
          },
          {
            name: "rewardAccrued",
            type: "u64",
          },
          {
            name: "nftsStaked",
            type: "u64",
          },
          {
            name: "initiatedUsers",
            type: "u64",
          },
          {
            name: "activeStakers",
            type: "u64",
          },
          {
            name: "creatorWhitelist",
            type: "publicKey",
          },
        ],
      },
    },
    {
      name: "user",
      type: {
        kind: "struct",
        fields: [
          {
            name: "user",
            type: "publicKey",
          },
          {
            name: "config",
            type: "publicKey",
          },
          {
            name: "rewardAccrued",
            type: "u64",
          },
          {
            name: "lastStakeTime",
            type: "u64",
          },
          {
            name: "timeLastClaim",
            type: "u64",
          },
          {
            name: "nftsStaked",
            type: "u64",
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "ArithmeticError",
      msg: "Failed to perform math operation safely",
    },
    {
      code: 6001,
      name: "AnchorSerializationIssue",
      msg: "Anchor serialization issue",
    },
    {
      code: 6002,
      name: "InvalidUserState",
      msg: "Unauthorized, invalid user state PDA",
    },
    {
      code: 6003,
      name: "InvalidStakingConfig",
      msg: "Unauthorized, invalid staking config PDA",
    },
    {
      code: 6004,
      name: "UserNeverStake",
      msg: "Cannot claim, user never stake anything",
    },
    {
      code: 6005,
      name: "EmptyVault",
      msg: "Vault empty, nothing to unstake",
    },
    {
      code: 6006,
      name: "NotWhitelisted",
      msg: "NFT creator address is not present in any of the whitelists",
    },
    {
      code: 6007,
      name: "NotStaked",
      msg: "NFT is not present in any stake proof",
    },
    {
      code: 6008,
      name: "CannotUnstakeYet",
      msg: "NFT is in lock period, cannot unstake yet until it reach minimum staking period",
    },
  ],
};
