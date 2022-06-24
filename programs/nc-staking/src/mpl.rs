use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use solana_program::instruction::Instruction;

#[derive(Accounts)]
pub struct FreezeOrThawDelegatedAccount<'info> {
    /// CHECK: for cpi, onus on program to check
    pub delegate: AccountInfo<'info>,
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    /// CHECK: for cpi, onus on program to check
    pub edition: AccountInfo<'info>,
    /// CHECK: for cpi, onus on program to check
    pub mint: AccountInfo<'info>,
    /// CHECK: for cpi, onus on program to check
    pub token_program: AccountInfo<'info>,
    pub token_metadata_program: Program<'info, TokenMetadata>,
}

impl<'info> FreezeOrThawDelegatedAccount<'info> {
    pub fn freeze_or_thaw(&self, freeze: bool, signer_seeds: &[&[u8]]) -> Result<()> {
        let mut data: Vec<u8> = Vec::new();
        if freeze {
            data.push(26); // freeze
        } else {
            data.push(27); // thaw
        }

        let accounts = vec![
            AccountMeta::new_readonly(self.delegate.key(), true),
            AccountMeta::new(self.token_account.key(), false),
            AccountMeta::new_readonly(self.edition.key(), false),
            AccountMeta::new_readonly(self.mint.key(), false),
            AccountMeta::new_readonly(self.token_program.key(), false),
        ];
        let ix = Instruction {
            program_id: self.token_metadata_program.key(),
            accounts,
            data,
        };

        solana_program::program::invoke_signed(
            &ix,
            &[
                self.delegate.clone(),
                self.token_account.to_account_info(),
                self.edition.clone(),
                self.mint.clone(),
                self.token_program.clone(),
            ],
            &[signer_seeds],
        )
        .map_err(Into::into)
    }
}

#[derive(Clone)]
pub struct TokenMetadata;

impl anchor_lang::Id for TokenMetadata {
    fn id() -> Pubkey {
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
            .parse()
            .unwrap()
    }
}
