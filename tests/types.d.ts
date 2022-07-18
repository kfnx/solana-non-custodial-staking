interface StakingConfig {
  keypair: import("@solana/web3.js").Keypair;
  option: StakingConfigOption;
}

type BN = import("@project-serum/anchor").BN;

interface StakingConfigOption {
  rewardPerSec: BN;
  rewardDenominator: BN;
  stakingLockDurationInSec: BN;
}
