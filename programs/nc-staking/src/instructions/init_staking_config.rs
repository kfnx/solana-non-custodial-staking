use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitStakingConfig<'info> {
  #[account(
        init,
        payer=admin,
        space = 8 + std::mem::size_of::<StakingConfig>(),
        seeds=[
          b"config",
          admin.to_account_info().key.as_ref()
        ],
        bump,
    )]
  pub config: Account<'info, StakingConfig>,
  #[account(mut)]
  pub admin: Signer<'info>,
  pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitStakingConfig>) -> Result<()> {
  let config = &mut ctx.accounts.config;
  let admin: &Signer = &ctx.accounts.admin;
  config.admin = *admin.key;
  msg!("instruction handler: InitStakingConfig");
  Ok(())
}
