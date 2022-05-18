use anchor_lang::prelude::*;

// #[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
// pub struct Config {
//     pub min_staking_period_sec: u64,
// }

#[account]
pub struct StakingConfig {
    pub admin: Pubkey,
    pub reward_pot: Pubkey,
    pub reward_mint: Pubkey,
    // we use config_authority to guard claim and stake instruction
    pub config_authority: Pubkey,
    pub config_authority_seed: Pubkey,
    pub config_authority_bump_seed: [u8; 1],
    pub reward_rate: u64,
    // pub reward_rate_denominator: u64,
    pub reward_accrued: u64,
    pub nfts_staked: u64,
    pub initiated_users: u64,
    pub active_stakers: u64,
    pub min_staking_period_sec: u64,
    // list of whitelisted creator address
    pub whitelisted_creator: bool,
}

impl StakingConfig {
    pub fn auth_seeds(&self) -> [&[u8]; 3] {
        [
            b"config",
            self.config_authority_seed.as_ref(),
            &self.config_authority_bump_seed,
        ]
    }
}
