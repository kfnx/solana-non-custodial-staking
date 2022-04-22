use solana_program;

pub fn freezeDelegatedAccount<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, FreezeDelegatedAccount<'info>>,
) -> Result<()> {
    let ix = spl_token::instruction::transfer( // TODO
        &spl_token::ID,
        ctx.accounts.delegate.key,
        ctx.accounts.token_account.key,
        ctx.accounts.edition.key,
        ctx.accounts.mint.key,
        ctx.accounts.token_program.key,
        &[],
        amount,
    )?;
    solana_program::program::invoke_signed(
        &ix,
        &[
            ctx.accounts.delegate.clone(),
            ctx.accounts.token_account.clone(),
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
    pub delegate: AccountInfo<'info>,
    pub token_account: AccountInfo<'info>,
    pub edition: AccountInfo<'info>,
    pub mint: AccountInfo<'info>,
    pub token_program: AccountInfo<'info>,
}
