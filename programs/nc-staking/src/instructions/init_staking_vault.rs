use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitStakingVault<'info> {
  #[account(
        init,
        payer=owner,
        space = 8 + std::mem::size_of::<Vault>(),
        seeds=[
          b"vault",
          owner.to_account_info().key.as_ref()
        ],
        bump,
    )]
  pub vault: Account<'info, Vault>,
  #[account(mut)]
  pub owner: Signer<'info>,
  pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitStakingVault>) -> Result<()> {
  let vault = &mut ctx.accounts.vault;
  let owner: &Signer = &ctx.accounts.owner;
  vault.owner = *owner.key;
  vault.total_staked = 0;
  msg!("instruction handler: InitStakingVault");
  Ok(())
}
