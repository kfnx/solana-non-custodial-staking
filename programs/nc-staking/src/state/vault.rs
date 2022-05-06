use anchor_lang::prelude::*;

#[account]
pub struct Vault {
    pub user: Pubkey,
    pub time_created: u64,
    pub total_staked: u64,
}
