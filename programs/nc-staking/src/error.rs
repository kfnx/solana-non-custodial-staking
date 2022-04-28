use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized, invalid vault owner")]
    InvalidVaultOwner,
    #[msg("Vault empty, nothing to unstake")]
    EmptyVault,
}
