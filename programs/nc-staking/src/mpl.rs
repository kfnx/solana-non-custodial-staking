use anchor_lang::prelude::*;
use solana_program::instruction::Instruction;
use anchor_spl::token::{TokenAccount};

// const TOKEN_METADATA_ID: Pubkey = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s".parse().unwrap();

pub fn thaw_delegated_account<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, FreezeDelegatedAccount<'info>>,
) -> Result<()> {
    let ix = make_instruction(
        ctx.accounts.delegate.key,
        &ctx.accounts.token_account.key(),
        ctx.accounts.edition.key,
        ctx.accounts.mint.key,
        ctx.accounts.token_program.key,
        false,
    )?;
    solana_program::program::invoke_signed(
        &ix,
        &[
            ctx.accounts.delegate.clone(),
            ctx.accounts.token_account.to_account_info(),
            ctx.accounts.edition.clone(),
            ctx.accounts.mint.clone(),
            ctx.accounts.token_program.clone(),
        ],
        ctx.signer_seeds,
    )
    .map_err(Into::into)
}

pub fn freeze_delegated_account<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, FreezeDelegatedAccount<'info>>,
) -> Result<()> {
    let ix = make_instruction(
        ctx.accounts.delegate.key,
        &ctx.accounts.token_account.key(),
        ctx.accounts.edition.key,
        ctx.accounts.mint.key,
        ctx.accounts.token_program.key,
        true,
    )?;
    solana_program::program::invoke_signed(
        &ix,
        &[
            ctx.accounts.delegate.clone(),
            ctx.accounts.token_account.to_account_info(),
            ctx.accounts.edition.clone(),
            ctx.accounts.mint.clone(),
            ctx.accounts.token_program.clone(),
        ],
        ctx.signer_seeds,
    )
    .map_err(Into::into)
}

#[derive(Accounts)]
pub struct FreezeDelegatedAccount<'info> {
    /// CHECK: delegate not read write
    pub delegate: AccountInfo<'info>,
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    /// CHECK: delegate not read write
    pub edition: AccountInfo<'info>,
    /// CHECK: delegate not read write
    pub mint: AccountInfo<'info>,
    /// CHECK: delegate not read write
    pub token_program: AccountInfo<'info>,
}


fn make_instruction(
    delegate: &Pubkey,
    token_account: &Pubkey,
    edition: &Pubkey,
    mint: &Pubkey,
    token_program: &Pubkey,
    freeze: bool,
) -> Result<Instruction> {
    let mut data: Vec<u8> = Vec::new();
    if freeze {
        data.push(26); // freeze
    } else {
        data.push(27); // thaw
    }
    
    let mut accounts = Vec::with_capacity(5);
    accounts.push(AccountMeta::new_readonly(*delegate, true));
    accounts.push(AccountMeta::new(*token_account, false));
    accounts.push(AccountMeta::new_readonly(*edition, false));
    accounts.push(AccountMeta::new_readonly(*mint, false));
    accounts.push(AccountMeta::new_readonly(*token_program, false));

    Ok(Instruction {
        program_id: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s".parse().unwrap(),
        accounts,
        data,
    })
}

#[derive(Clone)]
pub struct TokenMetadata;

impl anchor_lang::Id for TokenMetadata {
    fn id() -> Pubkey {
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s".parse().unwrap()
    }
}
