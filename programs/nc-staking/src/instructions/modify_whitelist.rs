use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ModifyWhitelist<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, has_one = admin)]
    pub config: Account<'info, StakingConfig>,
    /// CHECK: not read or written
    pub creator_address_to_whitelist: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ModifyWhitelist>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.creator_whitelist = ctx.accounts.creator_address_to_whitelist.key();
    msg!(
        "{} updated config whitelist",
        &ctx.accounts.creator_address_to_whitelist.key()
    );
    Ok(())
}
