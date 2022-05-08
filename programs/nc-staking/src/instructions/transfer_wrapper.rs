use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct TransferWrapper<'info> {
    pub sender: Signer<'info>,
    #[account(mut)]
    pub sender_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub receiver_token: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

impl<'info> TransferWrapper<'info> {
    fn transfer_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.sender_token.to_account_info(),
                to: self.receiver_token.to_account_info(),
                authority: self.sender.to_account_info(),
            },
        )
    }
}

pub fn handler(ctx: Context<TransferWrapper>, amount: u64) -> Result<()> {
    msg!("starting tokens: {}", ctx.accounts.sender_token.amount);
    token::transfer(ctx.accounts.transfer_ctx(), amount)?;
    ctx.accounts.sender_token.reload()?;
    msg!("remaining tokens: {}", ctx.accounts.sender_token.amount);
    Ok(())
}
