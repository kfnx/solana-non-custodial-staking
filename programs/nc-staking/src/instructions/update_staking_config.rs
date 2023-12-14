use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(bump_config_auth: u8)]
pub struct UpdateStakingConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut,
      has_one = admin
    )]
    pub config: Account<'info, StakingConfig>,
}

pub fn handle_update_staking_config(
    ctx: Context<UpdateStakingConfig>,
    reward_per_sec: u64,
    reward_denominator: u64,
    staking_lock_duration_in_sec: u64,
) -> Result<()> {
    let config: &mut Account<'_, StakingConfig> = &mut ctx.accounts.config;
    config.reward_per_sec = reward_per_sec;
    config.reward_denominator = reward_denominator;
    config.staking_lock_duration_in_sec = staking_lock_duration_in_sec;
    Ok(())
}
