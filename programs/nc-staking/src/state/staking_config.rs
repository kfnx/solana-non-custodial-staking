use anchor_lang::prelude::*;

#[account]
pub struct StakingConfig {
    pub admin: Pubkey,
    pub staking_reward_token: Pubkey,
    pub authority_seed: Pubkey,
    pub authority_bump_seed: [u8; 1],
    pub staking_reward_accrued: i64,
    pub registered_stakers: i64,
    pub active_stakers: i64,
    pub nft_staked: i64,
}

impl StakingConfig {
    pub fn seeds(&self) -> [&[u8]; 2] {
        [
            self.authority_seed.as_ref(),
            &self.authority_bump_seed,
        ]
    }
}
