use crate::mpl;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Thaw<'info> {
    #[account(
        mut,
        token::authority = user,
        constraint = user.key == &token_account.owner
    )]
    token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    user: Signer<'info>,
    #[account(
        seeds=[b"delegate", token_account.key().as_ref()],
        bump
    )]
    /// CHECK: PDA
    delegate: AccountInfo<'info>,
    /// CHECK: PDA for metaplex; also freeze auth
    edition: AccountInfo<'info>,
    mint: Account<'info, Mint>,           // mint address
    token_program: Program<'info, Token>, // constraint here to check token program is legit
    token_metadata_program: Program<'info, mpl::TokenMetadata>, // constraint here to check token metadata program is legit
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Thaw>) -> Result<()> {
    let seeds = [
        b"delegate",
        ctx.accounts.token_account.to_account_info().key.as_ref(),
    ];
    let (_, bump) = Pubkey::find_program_address(&seeds, ctx.program_id);

    let auth_seeds = [
        b"delegate",
        ctx.accounts.token_account.to_account_info().key.as_ref(),
        &[bump],
    ];
    let cpi_accounts = mpl::FreezeOrThawDelegatedAccount {
        delegate: ctx.accounts.delegate.clone(),
        token_account: ctx.accounts.token_account.clone(),
        edition: ctx.accounts.edition.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        token_metadata_program: ctx.accounts.token_metadata_program.clone()
    };

    cpi_accounts.freeze_or_thaw(false,&auth_seeds)?;
    msg!("instruction handler: Thaw");
    Ok(())
}
