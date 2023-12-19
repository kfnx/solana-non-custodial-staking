use crate::instructions::*;
use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod mpl;
pub mod safe_math;
pub mod state;
pub mod utils;

declare_id!("stakEUMMv9bRHYX4CyVY48i19ViBdNSzn8Rt1a1Fi6E");

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
        instructions::init_staking_config::handle_init_staking_config(
            ctx,
            bump_config_auth,
            reward_per_sec,
            reward_denominator,
            staking_lock_duration_in_sec,
        )
    }
    pub fn update_staking_config(
        ctx: Context<UpdateStakingConfig>,
        reward_per_sec: u64,
        reward_denominator: u64,
        staking_lock_duration_in_sec: u64,
    ) -> Result<()> {
        instructions::update_staking_config::handle_update_staking_config(
            ctx,
            reward_per_sec,
            reward_denominator,
            staking_lock_duration_in_sec,
        )
    }
    pub fn init_staking(ctx: Context<InitStaking>) -> Result<()> {
        instructions::init_staking::handle_init_staking(ctx)
    }

    pub fn stake(ctx: Context<Stake>) -> Result<()> {
        instructions::stake::handle_stake(ctx)
    }

    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        instructions::unstake::handle_unstake(ctx)
    }

    pub fn admin_unstake(ctx: Context<AdminUnstake>) -> Result<()> {
        instructions::admin_unstake::handle_admin_unstake(ctx)
    }

    pub fn claim(
        ctx: Context<ClaimStakingReward>,
        _bump_config_auth: u8,
        _bump_reward_pot: u8,
    ) -> Result<()> {
        instructions::claim::handle_claim(ctx)
    }

    pub fn upgrade_user_state(ctx: Context<UpgradeUserState>) -> Result<()> {
        instructions::upgrade_user_state::handle_upgrade_user_state(ctx)
    }
}
