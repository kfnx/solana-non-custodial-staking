use crate::{
    claim::calc_reward,
    errors::ErrorCode,
    mpl,
    state::*,
    utils::{close_account, now_ts},
};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, has_one = user)]
    pub user_state: Account<'info, User>,
    #[account(mut)]
    pub config: Account<'info, StakingConfig>,
    #[account(
        mut,
        seeds=[b"stake_info", user.key().as_ref(), mint.key().as_ref()],
        bump,
        has_one=config @ ErrorCode::InvalidStakingConfig
    )]
    stake_info: Account<'info, StakeInfo>,
    #[account(
        mut,
        token::authority = user,
        constraint = user.key == &token_account.owner
    )]
    token_account: Account<'info, TokenAccount>,
    #[account(
        seeds=[b"delegate", token_account.key().as_ref()],
        bump
    )]
    /// CHECK: PDA
    delegate: AccountInfo<'info>,
    /// CHECK: PDA for metaplex; also freeze auth
    edition: AccountInfo<'info>,
    mint: Account<'info, Mint>,           // mint address
    token_program: Program<'info, Token>, // constraint here to check token program is legit
    token_metadata_program: Program<'info, mpl::TokenMetadata>, // constraint here to check token metadata program is legit
    system_program: Program<'info, System>,
}

fn assert_unstake_allowed<'info>(
    stake_info: &Account<'info, StakeInfo>,
    config: &Account<'info, StakingConfig>,
) -> Result<()> {
    let time_now = now_ts()?;
    let time_when_unlocked = stake_info
        .time_staking_start
        .checked_add(config.staking_lock_duration_in_sec)
        .unwrap();
    if time_when_unlocked > time_now {
        return Err(error!(ErrorCode::CannotUnstakeYet));
    }

    Ok(())
}

pub fn handler(ctx: Context<Unstake>) -> Result<()> {
    // check minimum time to unstake
    let config = &ctx.accounts.config;
    let stake_info = &ctx.accounts.stake_info;
    assert_unstake_allowed(stake_info, config)?;

    let user_state = &mut ctx.accounts.user_state;
    let user = *ctx.accounts.user.to_account_info().key;

    if user_state.user != user {
        return Err(error!(ErrorCode::InvalidUserState));
    }
    if user_state.nfts_staked < 1 {
        return Err(error!(ErrorCode::EmptyVault));
    }

    let seeds = [
        b"delegate",
        ctx.accounts.token_account.to_account_info().key.as_ref(),
    ];
    let (_, bump) = Pubkey::find_program_address(&seeds, ctx.program_id);
    let auth_seeds = [
        b"delegate",
        ctx.accounts.token_account.to_account_info().key.as_ref(),
        &[bump],
    ];
    let mpl_helper = mpl::FreezeOrThawDelegatedAccount {
        delegate: ctx.accounts.delegate.clone(),
        token_account: ctx.accounts.token_account.clone(),
        edition: ctx.accounts.edition.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        token_metadata_program: ctx.accounts.token_metadata_program.clone(),
    };

    mpl_helper.freeze_or_thaw(false, &auth_seeds)?;

    // store prev stake reward
    let time_now = now_ts()?;
    let total_reward = calc_reward(
        time_now,
        user_state.nfts_staked,
        user_state.time_last_stake,
        user_state.time_last_claim,
        user_state.reward_stored,
        user_state.time_staking_start,
        config.reward_per_sec,
        config.reward_denominator,
        config.staking_lock_duration_in_sec,
    );
    user_state.reward_stored = total_reward;
    msg!("reward stored: {}", user_state.reward_stored);
    user_state.time_last_stake = time_now;
    user_state.nfts_staked = user_state.nfts_staked.checked_sub(1).unwrap();

    let config = &mut ctx.accounts.config;
    config.nfts_staked = config.nfts_staked.checked_sub(1).unwrap();

    // subtract active stakers when the user staked NFT reach 0
    if user_state.nfts_staked == 0 {
        config.active_stakers = config.active_stakers.checked_sub(1).unwrap();
    }
    close_account(
        &mut ctx.accounts.stake_info.to_account_info(),
        &mut ctx.accounts.user.to_account_info(),
    )?;
    Ok(())
}
