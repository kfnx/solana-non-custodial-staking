use crate::instructions::*;
use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod mpl;
pub mod state;
pub mod utils;

declare_id!("stakEUMMv9bRHYX4CyVY48i19ViBdNSzn8Rt1a1Fi6E");

#[program]
pub mod nc_staking {
    use super::*;

    pub fn init_staking_config(
        ctx: Context<InitStakingConfig>,
        bump_config_auth: u8,
        reward_rate: u64,
    ) -> Result<()> {
        instructions::init_staking_config::handler(ctx, bump_config_auth, reward_rate)
    }
    pub fn init_staking(ctx: Context<InitStaking>) -> Result<()> {
        instructions::init_staking::handler(ctx)
    }

    pub fn stake(ctx: Context<Stake>) -> Result<()> {
        instructions::stake::handler(ctx)
    }

    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        instructions::unstake::handler(ctx)
    }

    pub fn claim(
        ctx: Context<ClaimStakingReward>,
        _bump_config_auth: u8,
        _bump_reward_pot: u8,
    ) -> Result<()> {
        instructions::claim::handler(ctx)
    }

    pub fn add_whitelist(ctx: Context<AddWhitelist>) -> Result<()> {
        instructions::add_whitelist::handler(ctx)
    }
}
