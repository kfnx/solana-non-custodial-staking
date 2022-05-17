use anchor_lang::prelude::*;

/// whitelist NFT to stake by creator address
#[account]
pub struct Whitelist {
    pub config: Pubkey,
    pub creator: Pubkey,
}
