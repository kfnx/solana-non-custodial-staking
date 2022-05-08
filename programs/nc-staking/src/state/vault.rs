use anchor_lang::prelude::*;

#[account]
pub struct Vault {
    pub user: Pubkey,
    pub token_accrued: i64,
    pub time_last_stake: i64,
    pub time_last_claim: i64,
    pub total_staked: i64,
}
