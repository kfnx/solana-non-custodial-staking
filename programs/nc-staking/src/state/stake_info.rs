use anchor_lang::prelude::*;

#[account]
pub struct StakeInfo {
    pub config: Pubkey,
    pub staking_start_time: u64,
}
