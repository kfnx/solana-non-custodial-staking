import * as anchor from "@project-serum/anchor";
import { Keypair } from "@solana/web3.js";
import { createUser } from "./utils";

const denominator = new anchor.BN(10_000_000);

export const store = {
  /**
   * Users:
   * Dev
   * NftCreator
   * Justin
   * Markers
   */
  dev: createUser(
    Keypair.fromSecretKey(
      Uint8Array.from(
        // 6s5EfTaCCNQ855n8nTqDHue6XJ3hDaxB2ynj727AmgPt
        [
          46, 153, 255, 163, 58, 223, 86, 187, 209, 167, 46, 176, 18, 225, 156,
          176, 71, 14, 67, 109, 146, 108, 110, 61, 230, 47, 140, 147, 96, 222,
          171, 222, 87, 30, 67, 166, 139, 42, 111, 149, 250, 38, 72, 195, 127,
          111, 117, 250, 132, 207, 86, 106, 250, 33, 178, 119, 200, 158, 134,
          82, 70, 103, 165, 27,
        ]
      )
    )
    // new anchor.web3.Connection(clusterApiUrl("devnet"))
  ),
  justin: createUser(
    Keypair.fromSecretKey(
      Uint8Array.from(
        // HwToSSqew673tpmGc2VqH4Q6kZJnxHmNZauTud5WoumL
        [
          141, 58, 226, 141, 130, 99, 186, 38, 86, 15, 152, 191, 236, 139, 29,
          19, 115, 176, 159, 145, 188, 210, 203, 64, 37, 188, 89, 4, 145, 255,
          180, 35, 251, 174, 168, 122, 192, 149, 227, 185, 114, 75, 193, 206,
          166, 209, 149, 87, 11, 239, 79, 164, 156, 153, 233, 57, 57, 245, 252,
          117, 28, 82, 178, 219,
        ]
      )
    )
  ),
  NFTcreator: createUser(
    Keypair.fromSecretKey(
      Uint8Array.from(
        // cretSiBGE5V7BJXnLsE84GBX5X8jxuSnbBfhAVpwGqU
        [
          238, 138, 236, 130, 250, 209, 147, 210, 134, 105, 215, 196, 0, 151,
          177, 169, 208, 115, 238, 204, 146, 68, 167, 6, 83, 64, 72, 10, 83, 13,
          67, 39, 9, 47, 120, 173, 108, 96, 173, 245, 129, 154, 169, 179, 168,
          238, 210, 173, 38, 63, 95, 127, 158, 26, 20, 158, 8, 13, 53, 56, 2,
          88, 126, 55,
        ]
      )
    )
  ),
  markers: createUser(
    Keypair.fromSecretKey(
      // mar1nrVs4KCvigLCRFEuX9RsfJieDxFMBErBCNmiRCY
      Uint8Array.from([
        122, 210, 2, 101, 246, 207, 210, 129, 1, 212, 17, 31, 114, 249, 37, 25,
        64, 124, 33, 5, 28, 39, 240, 244, 158, 138, 202, 187, 253, 186, 36, 75,
        11, 107, 211, 7, 134, 147, 81, 61, 247, 39, 115, 162, 158, 130, 209,
        156, 31, 205, 87, 174, 184, 198, 254, 72, 28, 59, 25, 167, 222, 20, 12,
        5,
      ])
    )
  ),
  rewardToken: Keypair.fromSecretKey(
    // rw1s6APBqeaLyTtTVSfh3CVvZ1XiusuEpLsr1y8Dgeq
    Uint8Array.from([
      105, 206, 31, 181, 88, 182, 108, 102, 122, 122, 135, 109, 61, 16, 60, 240,
      138, 99, 24, 85, 10, 73, 110, 185, 188, 203, 93, 148, 48, 98, 127, 209,
      12, 202, 136, 211, 93, 163, 65, 41, 45, 50, 187, 80, 182, 195, 104, 221,
      13, 199, 186, 193, 64, 86, 6, 202, 168, 169, 198, 59, 225, 25, 127, 222,
    ])
  ),
  /**
   *
   * Constants
   * Total seconds in 1 day: 1*24*60*60 = 86400
   * Total seconds in 365 day: 365*24*60*60 = 31536000
   * Total NFT: 10000
   *
   * Fixed time to ease calculation
   * 1 month: 30 day
   * 1 year: 365 day
   *
   * 🌾 Staking Config 0 (Testing)
   * IGS/second estimate: 1
   * Base Rate: 1157407
   * Denominator: 10000000000 (less 1 zero from production)
   * Locking Duration: 0 seconds or Flexible
   *
   * IGS/day: 1.25
   * Locking Duration: 1200 seconds or 20 Minutes
   *
   * IGS/day: 2
   * Locking Duration: 7200 seconds or 2 Hour
   *
   * IGS/day: 1.25
   * Locking Duration: 604800 seconds or 7 Days
   * IGS/day: 2
   * Locking Duration: 2592000 seconds or 30 Days
   * IGS/day: 2.5
   * Locking Duration: 5184000 seconds or 60 Days
   * IGS/day: 3
   * Locking Duration: 7776000 seconds or 90 Days
   *
   * 🌾 Staking Config 1
   * IGS/day: 1
   * IGS/second estimate: 1/86400 ≈ 0.00001157407
   * Total reward for 1 year: 1*365*10000 = 3650000
   * Base Rate: 1157407
   * Denominator: 100000000000
   * Locking Duration (day): 0
   * Locking Duration (second): 0
   *
   * 🌾 Staking Config 2
   * IGS/day: 1.25
   * IGS/second estimate: 1.25/86400 ≈ 0.00001446759
   * Total reward for 1 year: 1.25*365*10000 = 4562500
   * Base Rate: 1446759
   * Denominator: 100000000000
   * Locking Duration (day): 7
   * Locking Duration (second): 7*86400 = 604800
   *
   * 🌾 Staking Config 3
   * IGS/day: 2
   * IGS/second estimate: 2/86400 ≈  0.00002314814
   * Total reward for 1 year: 2*365*10000 = 7300000
   * Base Rate: 2314814
   * Denominator: 100000000000
   * Locking Duration (day): 30
   * Locking Duration (second): 30*86400 = 2592000
   *
   * 🌾 Staking Config 4
   * IGS/day: 2.5
   * IGS/second estimate: 2.5/86400 ≈  0.00002893518
   * Total reward for 1 year: 2.5*365*10000 = 9125000
   * Base Rate: 2893518
   * Denominator: 100000000000
   * Locking Duration (day): 60
   * Locking Duration (second): 60*86400 = 5184000
   *
   * 🌾 Staking Config 5
   * IGS/day: 3
   * IGS/second estimate: 3/(86400) ≈  0.00003472222
   * Total reward for 1 year: 3*365*10000 = 10950000
   * Base Rate: 3472222
   * Denominator: 100000000000
   * Locking Duration (day): 90
   * Locking Duration (second): 90*86400 = 7776000
   *
   */

  // we reduce the zeros because we want to work with higher number in testing
  // produciton denom will be 100_000_000_000 (4 more zero)

  configs: [
    {
      // testing config
      option: {
        rewardPerSec: new anchor.BN(1),
        rewardDenominator: new anchor.BN(1),
        stakingLockDurationInSec: new anchor.BN(5),
      },
      keypair: Keypair.fromSecretKey(
        // scxhD8BnCBZvmXUB74TKFoyWn3MnkJcXS6wcMaSF7jz;
        Uint8Array.from([
          172, 168, 193, 87, 168, 105, 230, 13, 221, 176, 253, 43, 46, 216, 56,
          41, 255, 148, 215, 43, 25, 6, 144, 8, 49, 13, 67, 42, 134, 36, 252,
          105, 12, 247, 179, 104, 137, 150, 81, 154, 115, 87, 87, 253, 7, 224,
          138, 84, 208, 222, 54, 223, 244, 231, 21, 241, 152, 149, 79, 33, 100,
          233, 63, 117,
        ])
      ),
    },
    /* commented because more configs means more time to test. uncomment if you need more configs to test
    {
      // 1 / Day
      option: {
        // baseRate: 0.001157407407,
        rewardPerSec: new anchor.BN(1157407),
        rewardDenominator: denominator,
        stakingLockDurationInSec: new anchor.BN(0),
      },
      keypair: Keypair.fromSecretKey(
        // sc1B2RFctpCyFchTv3tmNAcCNuhNwojQFtx7NgSSUXN;
        Uint8Array.from([
          116, 42, 138, 155, 37, 2, 231, 209, 37, 141, 171, 188, 72, 140, 226,
          149, 115, 91, 70, 57, 96, 108, 120, 129, 44, 125, 93, 155, 205, 213,
          105, 189, 12, 246, 158, 82, 177, 229, 211, 177, 175, 171, 92, 148,
          133, 118, 185, 5, 8, 14, 80, 202, 8, 69, 106, 70, 206, 58, 36, 249,
          34, 216, 224, 197,
        ])
      ),
    },
    {
      // 1.25 / Day
      option: {
        // baseRate: 0.001808449,
        rewardPerSec: new anchor.BN(1808449),
        rewardDenominator: denominator,
        stakingLockDurationInSec: new anchor.BN(60),
      },
      keypair: Keypair.fromSecretKey(
        // sc2VLzGNJK4QeqfVTp1wkvpfKgK6kWAnSrd4uhFVB5T;
        Uint8Array.from([
          9, 26, 225, 222, 85, 154, 241, 92, 222, 202, 216, 249, 3, 21, 41, 71,
          42, 152, 18, 53, 20, 124, 205, 95, 105, 61, 177, 40, 177, 162, 237,
          250, 12, 246, 164, 227, 221, 196, 51, 101, 31, 159, 103, 28, 229, 39,
          127, 13, 147, 255, 41, 143, 117, 232, 121, 178, 6, 185, 112, 25, 185,
          210, 119, 42,
        ])
      ),
    },
    {
      // 2
      option: {
        // baseRate: 0.002314814,
        rewardPerSec: new anchor.BN(2314814),
        rewardDenominator: denominator,
        stakingLockDurationInSec: new anchor.BN(600),
      },
      keypair: Keypair.fromSecretKey(
        // sc3j8siipRaBZgAdtC2Virp93L9eQeGXBjpHKRULsKP;
        Uint8Array.from([
          189, 4, 119, 255, 28, 121, 181, 191, 251, 175, 166, 123, 153, 146, 76,
          78, 83, 71, 174, 251, 106, 140, 222, 11, 55, 6, 70, 154, 147, 199,
          229, 155, 12, 246, 171, 17, 69, 250, 28, 235, 244, 49, 10, 193, 172,
          55, 106, 66, 227, 54, 252, 198, 195, 171, 173, 134, 215, 173, 102, 55,
          252, 142, 193, 90,
        ])
      ),
    },
    {
      // 2.5
      option: {
        // baseRate: 0.002893518,
        rewardPerSec: new anchor.BN(2893518),
        rewardDenominator: denominator,
        stakingLockDurationInSec: new anchor.BN(5184000),
      },
      keypair: Keypair.fromSecretKey(
        // sc4iq8PqXqjWF8sG6PguMxkGvUWfVnyoGc2YP4LLEaS
        Uint8Array.from([
          41, 115, 56, 28, 69, 130, 35, 143, 1, 8, 19, 68, 144, 194, 34, 72, 0,
          119, 161, 2, 146, 216, 158, 171, 244, 40, 191, 219, 139, 33, 100, 232,
          12, 246, 176, 8, 38, 121, 143, 186, 192, 156, 145, 86, 213, 183, 74,
          188, 32, 211, 193, 184, 35, 24, 213, 237, 68, 36, 125, 45, 43, 224,
          102, 111,
        ])
      ),
    },
    {
      // 3
      option: {
        // baseRate: 0.003472222,
        rewardPerSec: new anchor.BN(3472222),
        rewardDenominator: denominator,
        stakingLockDurationInSec: new anchor.BN(7776000),
      },
      keypair: Keypair.fromSecretKey(
        // sc5yvCo9RovPfgZDxCexfJysnPYKTzMm6cWEcSz7Nco
        Uint8Array.from([
          249, 74, 217, 129, 124, 37, 68, 103, 130, 254, 171, 126, 168, 105,
          254, 98, 180, 133, 20, 187, 86, 156, 165, 212, 16, 148, 206, 71, 230,
          28, 68, 8, 12, 246, 182, 82, 29, 6, 109, 157, 151, 98, 49, 126, 223,
          47, 43, 167, 107, 203, 171, 186, 146, 11, 158, 51, 4, 167, 84, 49,
          229, 128, 0, 112,
        ])
      ),
    },
    */
  ] as StakingConfig[],
  nfts: [
    {
      mint: Keypair.generate(),
      metadata: {
        name: "Meekolony #1",
        symbol: "MKLN",
        uri: "https://arweave.net/4d1CV1GnALTT2iTyi1UiNc6AOrsL8h-sPAyVyNMlU4k",
        sellerFeeBasisPoints: 700,
        creators: [],
      },
    },
    {
      mint: Keypair.generate(),
      metadata: {
        name: "Meekolony #2",
        symbol: "MKLN",
        uri: "https://arweave.net/afxkSsnbrtCNAvbkqlCqjURUbBUSBDn_RMl1Dbq9YX8",
        sellerFeeBasisPoints: 700,
        creators: [],
      },
    },
    {
      mint: Keypair.generate(),
      metadata: {
        name: "Meekolony #3",
        symbol: "MKLN",
        uri: "https://arweave.net/I1Im-DDcnzEuLmB7Wiz1y3FknR0MwIwMVslDILHBr-g",
        sellerFeeBasisPoints: 700,
        creators: [],
      },
    },
    {
      mint: Keypair.generate(),
      metadata: {
        name: "Meekolony #4",
        symbol: "MKLN",
        uri: "https://arweave.net/RrE0HPbnv1HVVdF_DqQiFPA0YCDPli-_6zW45CBRPGc",
        sellerFeeBasisPoints: 700,
        creators: [],
      },
    },
    /* commented because more nft means more time to test. uncomment if you need more nft to test
    {
      mint: Keypair.generate(),
      metadata: {
        name: "Meekolony #5",
        symbol: "MKLN",
        uri: "https://arweave.net/WmQQC3iUXPuRvt6xsR9dI0ARbB2IJbON_NTB-y9clQw",
        sellerFeeBasisPoints: 700,
        creators: [],
      },
    },
    {
      mint: Keypair.generate(),
      metadata: {
        name: "Meekolony #6",
        symbol: "MKLN",
        uri: "https://arweave.net/1n6w6-FcZE3VO1HBNRW_T_Cvx9U3C0RVN54sFVlq3sw",
        sellerFeeBasisPoints: 700,
        creators: [],
      },
    },
    {
      mint: Keypair.generate(),
      metadata: {
        name: "Meekolony #7",
        symbol: "MKLN",
        uri: "https://arweave.net/O_4JMAd92XQ7_jo3CXJFSlR9eHMXvnVmDHhgkPk2nwc",
        sellerFeeBasisPoints: 700,
        creators: [],
      },
    },
    {
      mint: Keypair.generate(),
      metadata: {
        name: "Meekolony #8",
        symbol: "MKLN",
        uri: "https://arweave.net/2giACek19RaYiEPJcBdOgzyCYC_QHMf9i7qgnT3r8-U",
        sellerFeeBasisPoints: 700,
        creators: [],
      },
    },
    {
      mint: Keypair.generate(),
      metadata: {
        name: "Meekolony #9",
        symbol: "MKLN",
        uri: "https://arweave.net/xREW2gypD8FlI59fDJtigYSMm01YZTnSXBUTQ7vkY0c",
        sellerFeeBasisPoints: 700,
        creators: [],
      },
    },
    */
  ],
};
