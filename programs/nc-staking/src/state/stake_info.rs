use anchor_lang::prelude::*;

#[account]
pub struct StakeInfo {
    pub start_time: u64,
}
