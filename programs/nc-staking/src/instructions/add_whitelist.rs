use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct AddWhitelist<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, has_one = admin)]
    pub config: Account<'info, StakingConfig>,
    /// CHECK: not read or written
    pub creator_address_to_whitelist: AccountInfo<'info>,
    #[account(
        init_if_needed,
        seeds = [b"whitelist".as_ref(), config.key().as_ref(), creator_address_to_whitelist.key().as_ref()],
        bump,
        payer = admin,
        space = 8 + std::mem::size_of::<Whitelist>())]
    pub whitelist: Account<'info, Whitelist>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AddWhitelist>) -> Result<()> {
    let whitelist = &mut ctx.accounts.whitelist;
    whitelist.config = ctx.accounts.config.key();
    whitelist.creator = ctx.accounts.creator_address_to_whitelist.key();
    msg!("{} added whitelist", &ctx.accounts.whitelist.key());

    let config = &mut ctx.accounts.config;
    config.whitelisted_creator = true;
    msg!(
        "{} updated config whitelist",
        &ctx.accounts.creator_address_to_whitelist.key()
    );
    Ok(())
}
