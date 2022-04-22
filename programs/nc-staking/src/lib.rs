use anchor_lang::prelude::*;
use anchor_spl::token::{self,Approve,Token,TokenAccount};

declare_id!("stakEUMMv9bRHYX4CyVY48i19ViBdNSzn8Rt1a1Fi6E");

const DELEGATE_PDA_SEED: &[u8] = b"delegate";

#[program]
pub mod nc_staking {
    use super::*;

    pub fn freeze(ctx: Context<Freeze>) -> Result<()> {
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Approve {
            to: ctx.accounts.token_account.to_account_info(),
            delegate: ctx.accounts.delegate_auth.clone(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::approve(cpi_ctx, 1)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Freeze<'info> {
    #[account(
        mut,
        token::authority = user,
        constraint = user.key == &token_account.owner
    )]
    pub token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        seeds=[DELEGATE_PDA_SEED, token_account.key().as_ref()],
        bump
    )]
    /// CHECK: PDA
    pub delegate_auth: AccountInfo<'info>,
    pub token_program: Program<'info, Token>, // constraint here to check token program is legit
}

// Accounts
