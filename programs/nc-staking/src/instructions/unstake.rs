use crate::{error, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut, has_one = user)]
    pub vault: Account<'info, Vault>,
    pub user: Signer<'info>,
}

pub fn handler(ctx: Context<Unstake>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let user = *ctx.accounts.user.to_account_info().key;

    if vault.user != user {
        return Err(error::ErrorCode::InvalidVaultOwner.into());
    }
    if vault.total_staked < 1 {
        return Err(error::ErrorCode::EmptyVault.into());
    }
    vault.total_staked = vault.total_staked - 1;
    msg!("instruction handler: Unstake");
    Ok(())
}
