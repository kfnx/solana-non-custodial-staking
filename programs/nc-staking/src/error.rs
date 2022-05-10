use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized, invalid user state PDA")]
    InvalidUserState,
    #[msg("Cannot claim, user never stake anything")]
    UserNeverStake,
    #[msg("Vault empty, nothing to unstake")]
    EmptyVault,
}
