use crate::mpl;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Approve, Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Freeze<'info> {
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
    delegate_auth: AccountInfo<'info>,
    /// CHECK: PDA for metaplex; also freeze auth
    edition: AccountInfo<'info>,
    mint: Account<'info, Mint>,           // mint address
    token_program: Program<'info, Token>, // constraint here to check token program is legit
    token_metadata_program: Program<'info, mpl::TokenMetadata>, // constraint here to check token metadata program is legit
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Freeze>) -> Result<()> {
    // assign delegate to PDA
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_accounts = Approve {
        to: ctx.accounts.token_account.to_account_info(),
        delegate: ctx.accounts.delegate_auth.clone(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::approve(cpi_ctx, 1)?;

    // use pda to freeze
    let cpi_program = ctx.accounts.token_metadata_program.to_account_info();
    let cpi_accounts = mpl::FreezeDelegatedAccount {
        delegate: ctx.accounts.delegate_auth.clone(),
        token_account: ctx.accounts.token_account.clone(),
        edition: ctx.accounts.edition.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };
    let seeds = [
        b"delegate",
        ctx.accounts.token_account.to_account_info().key.as_ref(),
    ];
    let (_, bump) = Pubkey::find_program_address(&seeds, &ctx.program_id);
    let auth_seeds = [
        b"delegate",
        ctx.accounts.token_account.to_account_info().key.as_ref(),
        &[bump],
    ];
    let signer = &[&auth_seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    mpl::freeze_delegated_account(cpi_ctx)?;
    msg!("instruction handler: Freeze");
    Ok(())
}
