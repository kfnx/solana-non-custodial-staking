use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Failed to perform math operation safely")]
    ArithmeticError,

    #[msg("Anchor serialization issue")]
    AnchorSerializationIssue,

    #[msg("Unauthorized, invalid user state PDA")]
    InvalidUserState,

    #[msg("Unauthorized, invalid staking config PDA")]
    InvalidStakingConfig,

    #[msg("Cannot claim, user never stake anything")]
    UserNeverStake,

    #[msg("Vault empty, nothing to unstake")]
    EmptyVault,

    #[msg("NFT creator address is not present in any of the whitelists")]
    NotWhitelisted,

    #[msg("NFT is not present in any stake proof")]
    NotStaked,

    #[msg("NFT is in lock period, cannot unstake yet until it reach minimum staking period")]
    CannotUnstakeYet,
}
