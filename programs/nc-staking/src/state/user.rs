use anchor_lang::prelude::*;

#[account]
pub struct User {
    pub user: Pubkey,
    pub config: Pubkey,
    // pub user_authority: Pubkey,
    // pub user_authority_bump_seed: [u8; 1],
    pub reward_accrued: u64,
    pub reward_stored: u64,
    pub time_last_stake: u64,
    pub time_last_claim: u64,
    pub nfts_staked: u64,
}

// impl User {
//     pub fn seeds(&self) -> [&[u8]; 2] {
//         [self.user.as_ref(), &self.user_authority_bump_seed]
//     }
// }
