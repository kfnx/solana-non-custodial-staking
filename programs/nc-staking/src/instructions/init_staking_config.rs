use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(bump_auth: u8)]
pub struct InitStakingConfig<'info> {
  #[account(mut)]
  pub admin: Signer<'info>,
  #[account(
    init,
    payer = admin,
    space = 8 + std::mem::size_of::<StakingConfig>()
  )]
  pub config: Account<'info, StakingConfig>,
  /// CHECK:
  #[account(mut, seeds = [config.key().as_ref()], bump = bump_auth)]
  pub config_authority: AccountInfo<'info>,
  #[account(
    init,
    seeds = [b"reward_pot".as_ref(), config.key().as_ref(), reward_mint.key().as_ref()],
    bump,
    token::mint = reward_mint,
    token::authority = config_authority,
    payer = admin
  )]
  pub reward_pot: Box<Account<'info, TokenAccount>>,
  pub reward_mint: Box<Account<'info, Mint>>,

  // programs
  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitStakingConfig>, bump_auth: u8) -> Result<()> {
  let config = &mut ctx.accounts.config;
  config.admin = ctx.accounts.admin.key();
  config.reward_mint = ctx.accounts.reward_mint.key();
  config.reward_pot = ctx.accounts.reward_pot.key();
  config.config_authority = ctx.accounts.config_authority.key();
  config.config_authority = ctx.accounts.config_authority.key();
  config.config_authority_seed = config.key();
  config.config_authority_bump_seed = [bump_auth];
  // config.reward_rate = ctx.accounts.reward_mint.key();
  // config.reward_rate_denominator = ctx.accounts.reward_pot.key();
  msg!("instruction handler: InitStakingConfig");
  Ok(())
}
