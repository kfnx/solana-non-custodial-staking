use crate::{error, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Unstake<'info> {
    pub user: Signer<'info>,
    #[account(mut, has_one = user)]
    pub user_state: Account<'info, User>,
}

pub fn handler(ctx: Context<Unstake>) -> Result<()> {
    let user_state = &mut ctx.accounts.user_state;
    let user = *ctx.accounts.user.to_account_info().key;

    if user_state.user != user {
        return Err(error::ErrorCode::InvalidUserState.into());
    }
    if user_state.nfts_staked < 1 {
        return Err(error::ErrorCode::EmptyVault.into());
    }
    user_state.nfts_staked = user_state.nfts_staked.checked_sub(1).unwrap();
    msg!("instruction handler: Unstake");
    Ok(())
}
