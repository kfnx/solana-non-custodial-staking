use crate::{errors, safe_math::SafeMath, state::*, utils::now_ts};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
#[instruction(bump_config_auth: u8, bump_reward_pot: u8)]
pub struct ClaimStakingReward<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, has_one = config_authority)]
    pub config: Box<Account<'info, StakingConfig>>,
    /// CHECK:
    #[account(seeds = [b"config", config.key().as_ref()], bump = bump_config_auth)]
    pub config_authority: AccountInfo<'info>,
    #[account(mut)]
    pub user_state: Box<Account<'info, User>>,

    #[account(mut, seeds = [b"reward_pot".as_ref(), config.key().as_ref(), reward_mint.key().as_ref()], bump = bump_reward_pot)]
    pub reward_pot: Box<Account<'info, TokenAccount>>,
    pub reward_mint: Box<Account<'info, Mint>>,
    #[account(
        init_if_needed,
        associated_token::mint = reward_mint,
        associated_token::authority = user,
        payer = user
    )]
    pub reward_destination: Box<Account<'info, TokenAccount>>,

    // programs
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> ClaimStakingReward<'info> {
    fn transfer_reward_token_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.reward_pot.to_account_info(),
                to: self.reward_destination.to_account_info(),
                authority: self.config_authority.to_account_info(),
            },
        )
    }
}

pub fn calc_reward(
    time_now: u64,
    nfts_staked: u64,
    time_last_stake: u64,
    time_last_claim: u64,
    prev_reward_stored: u64,
    reward_per_sec: u64,
    reward_denominator: u64,
) -> u64 {
    msg!("time_now: {}", time_now);
    msg!("time_last_stake: {}", time_last_stake);
    msg!("time_last_claim: {}", time_last_claim);
    // if you never stake, you should get nothing
    if time_last_stake == 0 {
        return 0;
    };
    let time_accrued = if time_last_stake > time_last_claim {
        time_now.safe_sub(time_last_stake).unwrap()
    } else {
        time_now.safe_sub(time_last_claim).unwrap()
    };
    msg!("time_accrued: {}", time_accrued);
    msg!("reward_per_sec: {}", reward_per_sec);
    msg!("reward_denominator: {}", reward_denominator);
    msg!("nfts_staked: {}", nfts_staked);
    let reward_multiplied_by_time = reward_per_sec.safe_mul(time_accrued).unwrap();
    // msg!("reward * time: {}", reward_multiplied_by_time);
    let reward_multiplied_by_all_nft = nfts_staked.safe_mul(reward_multiplied_by_time).unwrap();
    // msg!("reward * time * nft: {}", reward_multiplied_by_all_nft);
    let reward_divided_by_denom = reward_multiplied_by_all_nft
        .safe_div(reward_denominator)
        .unwrap();
    // msg!("(reward * time * nft) / denom: {}", reward_divided_by_denom);
    msg!("prev_reward_stored: {}", prev_reward_stored);
    let total_reward = reward_divided_by_denom
        .safe_add(prev_reward_stored)
        .unwrap();
    msg!("total_reward: {}", total_reward);

    total_reward
}

pub fn handler(ctx: Context<ClaimStakingReward>) -> Result<()> {
    let config = &ctx.accounts.config;
    let user_state = &ctx.accounts.user_state;

    if user_state.time_last_stake == 0 {
        return Err(error!(errors::ErrorCode::UserNeverStake));
    }

    let time_now = now_ts()?;
    let total_reward = calc_reward(
        time_now,
        user_state.nfts_staked,
        user_state.time_last_stake,
        user_state.time_last_claim,
        user_state.reward_stored,
        config.reward_per_sec,
        config.reward_denominator,
    );

    token::transfer(
        ctx.accounts
            .transfer_reward_token_ctx()
            .with_signer(&[&config.auth_seeds()]),
        total_reward,
    )?;

    // record changes, for statistical use
    let config = &mut ctx.accounts.config;
    config.reward_accrued = config.reward_accrued.checked_add(total_reward).unwrap();
    let user_state = &mut ctx.accounts.user_state;
    user_state.reward_accrued = user_state.reward_accrued.checked_add(total_reward).unwrap();
    user_state.time_last_claim = time_now;
    // clear reward stored cos all claimed already
    user_state.reward_stored = 0;
    Ok(())
}
