use crate::instructions::*;
use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod mpl;
pub mod safe_math;
pub mod state;
pub mod utils;

declare_id!("stkMasspWTzjjNfRNb8v2QW8Hza73baxMqJ3mEi7LUW");

#[program]
pub mod nc_staking {
    use super::*;

    pub fn init_staking_config(
        ctx: Context<InitStakingConfig>,
        bump_config_auth: u8,
        reward_per_sec: u64,
        reward_denominator: u64,
        staking_lock_duration_in_sec: u64,
    ) -> Result<()> {
        instructions::init_staking_config::handler(
            ctx,
            bump_config_auth,
            reward_per_sec,
            reward_denominator,
            staking_lock_duration_in_sec,
        )
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

    pub fn modify_whitelist(ctx: Context<ModifyWhitelist>) -> Result<()> {
        instructions::modify_whitelist::handler(ctx)
    }
}
