use anchor_lang::prelude::*;

#[account]
pub struct StakeInfo {
    pub config: Pubkey,
    pub time_staking_start: u64,
    pub unclaimed_reward: u64,
}
