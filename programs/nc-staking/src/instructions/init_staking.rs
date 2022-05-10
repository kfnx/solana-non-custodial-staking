use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitStaking<'info> {
  #[account(mut)]
  pub user: Signer<'info>,
  #[account(
        init,
        payer = user,
        seeds = [
          b"user_state",
          // b"config", // for multiple farm in the future
          user.to_account_info().key.as_ref()
        ],
        bump,
        space = 8 + std::mem::size_of::<User>(),
    )]
  pub user_state: Account<'info, User>,
  pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitStaking>) -> Result<()> {
  let user = &mut ctx.accounts.user_state;
  user.user = ctx.accounts.user.key();
  user.reward_accrued = 0;
  user.time_last_stake = 0;
  user.time_last_claim = 0;
  user.nfts_staked = 0;
  msg!("instruction handler: InitStaking");
  Ok(())
}
