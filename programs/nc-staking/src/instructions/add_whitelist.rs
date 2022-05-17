use crate::state::*;
use anchor_lang::prelude::*;
use anchor_lang::Discriminator;
use arrayref::array_ref;

#[derive(Accounts)]
pub struct AddWhitelist<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(mut, has_one = admin)]
    pub config: Account<'info, StakingConfig>,
    /// CHECK:
    // #[account(seeds = [b"config", config.key().as_ref()], bump = bump_config_auth)]
    // pub config_authority: AccountInfo<'info>,
    /// CHECK:
    pub creator_address_to_whitelist: AccountInfo<'info>,
    // must stay init_as_needed, otherwise no way to change afterwards
    #[account(
        init_if_needed,
        seeds = [b"whitelist".as_ref(), config.key().as_ref(), creator_address_to_whitelist.key().as_ref()],
        bump,
        payer = admin,
        space = 8 + std::mem::size_of::<Whitelist>())]
    pub whitelist: Box<Account<'info, Whitelist>>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AddWhitelist>) -> Result<()> {
    // fix missing discriminator check
    {
        let acct = ctx.accounts.whitelist.to_account_info();
        let data: &[u8] = &acct.try_borrow_data()?;
        let disc_bytes = array_ref![data, 0, 8];
        if disc_bytes != &Whitelist::discriminator() && disc_bytes.iter().any(|a| a != &0) {
            return Err(error!(ErrorCode::AccountDiscriminatorMismatch));
        }
    }

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
