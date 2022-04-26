use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("The provided json data is empty or invalid.")]
    JsonDataInvalid,
    #[msg("The provided NFT is invalid.")]
    CannotUnstake,
}
