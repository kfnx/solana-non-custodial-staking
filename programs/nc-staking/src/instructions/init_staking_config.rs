use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(bump_config_auth: u8)]
pub struct InitStakingConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
      init,
      payer = admin,
      space = 8 + std::mem::size_of::<StakingConfig>()
    )]
    pub config: Account<'info, StakingConfig>,
    /// CHECK: not read or written
    pub creator_address_to_whitelist: AccountInfo<'info>,
    /// CHECK: used to transfer reward token to user from reward pot which the auth is config_authority
    #[account(
      mut,
      seeds = [b"config", config.key().as_ref()],
      bump = bump_config_auth
    )]
    pub config_authority: AccountInfo<'info>,
    #[account(
      init,
      seeds = [b"reward_pot".as_ref(), config.key().as_ref(), reward_mint.key().as_ref()],
      bump,
      token::mint = reward_mint,
      token::authority = config_authority,
      payer = admin
    )]
    pub reward_pot: Account<'info, TokenAccount>,
    pub reward_mint: Account<'info, Mint>,

    // programs
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle_init_staking_config(
    ctx: Context<InitStakingConfig>,
    bump_config_auth: u8,
    reward_per_sec: u64,
    reward_denominator: u64,
    staking_lock_duration_in_sec: u64,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.reward_mint = ctx.accounts.reward_mint.key();
    config.reward_pot = ctx.accounts.reward_pot.key();
    config.config_authority = ctx.accounts.config_authority.key();
    config.config_authority_seed = config.key();
    config.config_authority_bump_seed = [bump_config_auth];
    config.reward_per_sec = reward_per_sec;
    config.reward_denominator = reward_denominator;
    config.staking_lock_duration_in_sec = staking_lock_duration_in_sec;
    config.reward_accrued = 0;
    config.nfts_staked = 0;
    config.initiated_users = 0;
    config.active_stakers = 0;
    config.creator_whitelist = ctx.accounts.creator_address_to_whitelist.key();
    Ok(())
}
