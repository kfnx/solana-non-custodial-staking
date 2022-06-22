use anchor_lang::prelude::*;

// This PDA used as stake receipt / proof
#[account]
pub struct StakeInfo {
    pub config: Pubkey,
    pub time_staking_start: u64,
}
