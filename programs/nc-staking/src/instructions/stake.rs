use crate::{error, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut, has_one = user)]
    pub vault: Account<'info, Vault>,
    pub user: Signer<'info>,
}

pub fn handler(ctx: Context<Stake>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let user = *ctx.accounts.user.to_account_info().key;

    if vault.user != user {
        return Err(error::ErrorCode::InvalidVaultOwner.into());
    }
    vault.total_staked = vault.total_staked.checked_add(1).unwrap();
    msg!("instruction handler: Stake");
    Ok(())
}
