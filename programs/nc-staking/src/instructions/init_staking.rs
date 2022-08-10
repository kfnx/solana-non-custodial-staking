use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitStaking<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub config: Account<'info, StakingConfig>,
    #[account(
        init,
        payer = user,
        seeds = [
          b"user_state_v2",
          config.to_account_info().key.as_ref(),
          user.to_account_info().key.as_ref(),
        ],
        bump,
        space = 8 + std::mem::size_of::<UserV2>(),
    )]
    pub user_state: Account<'info, UserV2>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitStaking>) -> Result<()> {
    let user = &mut ctx.accounts.user_state;
    user.user = ctx.accounts.user.key();
    user.config = ctx.accounts.config.key();
    user.reward_accrued = 0;
    user.time_last_stake = 0;
    user.time_last_claim = 0;
    user.nfts_staked = 0;
    user.reward_stored = 0;
    let config = &mut ctx.accounts.config;
    config.initiated_users = config.initiated_users.checked_add(1).unwrap();
    Ok(())
}
