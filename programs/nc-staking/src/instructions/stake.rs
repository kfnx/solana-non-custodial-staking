use crate::{error, mpl, state::*, utils::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Approve, Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Stake<'info> {
    pub user: Signer<'info>,
    #[account(mut, has_one = user)]
    pub user_state: Account<'info, User>,
    #[account(
        mut,
        token::authority = user,
        constraint = user.key == &token_account.owner
    )]
    token_account: Account<'info, TokenAccount>,
    #[account(
        seeds=[b"delegate", token_account.key().as_ref()],
        bump
    )]
    /// CHECK: PDA
    delegate: AccountInfo<'info>,
    /// CHECK: only used for CPI, PDA for metaplex; also freeze auth
    edition: AccountInfo<'info>,
    mint: Account<'info, Mint>,           // mint address
    token_program: Program<'info, Token>, // constraint here to check token program is legit
    token_metadata_program: Program<'info, mpl::TokenMetadata>, // constraint here to check token metadata program is legit
    system_program: Program<'info, System>, // probably unneeded here; no init in freeze
}

impl<'info> Stake<'info> {
    fn approve_delegate_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Approve<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Approve {
                to: self.token_account.to_account_info(),
                delegate: self.delegate.clone(),
                authority: self.user.to_account_info(),
            },
        )
    }
}

pub fn handler(ctx: Context<Stake>) -> Result<()> {
    // assign delegate to PDA
    let cpi_ctx = ctx.accounts.approve_delegate_ctx();
    token::approve(cpi_ctx, 1)?;
    msg!(
        "Approve token delegate with key {}",
        ctx.accounts.delegate.key()
    );

    // use pda to freeze
    let mpl_helper = mpl::FreezeOrThawDelegatedAccount {
        delegate: ctx.accounts.delegate.clone(),
        token_account: ctx.accounts.token_account.clone(),
        edition: ctx.accounts.edition.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        token_metadata_program: ctx.accounts.token_metadata_program.clone(),
    };
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

    mpl_helper.freeze_or_thaw(true, &auth_seeds)?;
    msg!("instruction handler: Freeze");

    let user_state = &mut ctx.accounts.user_state;
    let user = *ctx.accounts.user.to_account_info().key;

    if user_state.user != user {
        return Err(error::ErrorCode::InvalidUserState.into());
    }
    user_state.nfts_staked = user_state.nfts_staked.checked_add(1).unwrap();
    user_state.time_last_stake = now_ts()?;
    msg!("instruction handler: Stake");
    Ok(())
}
