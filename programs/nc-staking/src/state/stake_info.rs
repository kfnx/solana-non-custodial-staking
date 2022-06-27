use anchor_lang::prelude::*;

// This PDA used as stake receipt / proof
#[account]
pub struct StakeInfo {
    pub config: Pubkey,
    pub user: Pubkey,
    pub mint: Pubkey,
    pub time_staking_start: u64,
}
