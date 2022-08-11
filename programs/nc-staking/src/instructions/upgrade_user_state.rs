use crate::{state::*, utils::close_account};
use anchor_lang::prelude::*;

/// This instruction is created due to deprecation of old user state structure
#[derive(Accounts)]
pub struct UpgradeUserState<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: read only, for passing user address
    pub actual_user: UncheckedAccount<'info>,
    /// CHECK: read only. state are per config
    pub config: Account<'info, StakingConfig>,
    #[account(
        mut,
        seeds = [
            b"user_state",
            config.to_account_info().key.as_ref(),
            actual_user.to_account_info().key.as_ref(),
          ],
        bump
    )]
    pub old_user_state: Account<'info, User>,
    #[account(
        init,
        payer = user,
        seeds = [
          b"user_state_v2",
          config.to_account_info().key.as_ref(),
          actual_user.to_account_info().key.as_ref(),
        ],
        bump,
        space = 8 + std::mem::size_of::<UserV2>(),
    )]
    pub new_user_state: Account<'info, UserV2>,
    pub system_program: Program<'info, System>,
}

/// Q&A
///
/// Q: Why user need to upgrade user state PDA?
/// A: Because we modify user state PDA structure and all the instruction is updated to use new structure.
///    in order to run any instructions user need to update their old PDA to use new data structure or any instruction they execute will cause error and fail
///
/// Q: Can user upgrade user state PDA more than once?
/// A: Cannot, once upgraded old PDA will be closed and it will contain no data
///
/// Q: Can user who init after program upgrade user state PDA?
/// A: Cannot, they already initiated new PDA
///
/// Q: Can user initiate with old PDA structure?
/// A: Cannot, the init staking instruction is also updated with new PDA structure.
///
pub fn handler(ctx: Context<UpgradeUserState>) -> Result<()> {
    let old = &ctx.accounts.old_user_state;
    let new = &mut ctx.accounts.new_user_state;
    new.user = old.user;
    new.config = old.config;
    new.reward_accrued = old.reward_accrued;
    new.reward_stored = old.reward_stored;
    new.time_last_stake = old.time_last_stake;
    new.time_last_claim = old.time_last_claim;
    new.nfts_staked = old.nfts_staked;
    new.time_staking_start = old.time_last_stake;
    close_account(
        &mut ctx.accounts.old_user_state.to_account_info(),
        &mut ctx.accounts.user.to_account_info(),
    )?;
    Ok(())
}
