use crate::{error, state::*, utils::now_ts};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Stake<'info> {
    pub user: Signer<'info>,
    #[account(mut, has_one = user)]
    pub user_state: Account<'info, User>,
}

pub fn handler(ctx: Context<Stake>) -> Result<()> {
    let user_state = &mut ctx.accounts.user_state;
    let user = *ctx.accounts.user.to_account_info().key;

    if user_state.user != user {
        return Err(error::ErrorCode::InvalidUserState.into());
    }
    user_state.nfts_staked = user_state.nfts_staked + 1;
    user_state.time_last_stake = now_ts()?;
    msg!("instruction handler: Stake");
    Ok(())
}
