use anchor_lang::prelude::*;

#[account]
pub struct Vault {
    pub owner: Pubkey,
    pub time_created: i64,
    pub total_staked: i64,
}
