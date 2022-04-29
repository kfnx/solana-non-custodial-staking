use anchor_lang::prelude::*;

#[account]
pub struct ProgramState {
    pub total_active_stakers: i64,
    pub total_nft_staked: i64,
}
