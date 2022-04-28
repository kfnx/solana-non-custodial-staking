use crate::{error, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut, has_one = owner)]
    pub vault: Account<'info, Vault>,
    pub owner: Signer<'info>,
}

pub fn handler(ctx: Context<Unstake>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let owner = *ctx.accounts.owner.to_account_info().key;

    if vault.owner != owner {
        return Err(error::ErrorCode::InvalidVaultOwner.into());
    }
    if vault.total_staked < 1 {
        return Err(error::ErrorCode::EmptyVault.into());
    }
    vault.total_staked = vault.total_staked - 1;
    msg!("instruction handler: Unstake");
    Ok(())
}
