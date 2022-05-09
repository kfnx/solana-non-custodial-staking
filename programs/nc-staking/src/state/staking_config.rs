use anchor_lang::prelude::*;

#[account]
pub struct StakingConfig {
    pub admin: Pubkey,
    pub reward_pot: Pubkey,
    pub reward_mint: Pubkey,
    pub config_authority: Pubkey,
    pub config_authority_seed: Pubkey,
    pub config_authority_bump_seed: [u8; 1],
    // pub reward_accrued: i64,
    // pub registered_stakers: i64,
    // pub active_stakers: i64,
    // pub nft_staked: i64,
}

impl StakingConfig {
    pub fn seeds(&self) -> [&[u8]; 2] {
        [self.config_authority_seed.as_ref(), &self.config_authority_bump_seed]
    }
}
