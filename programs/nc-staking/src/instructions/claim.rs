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
    #[account(
        mut,
        has_one = user,
        seeds = [b"user_state_v2", config.to_account_info().key.as_ref(), user.to_account_info().key.as_ref()],
        bump
    )]
    pub user_state: Box<Account<'info, UserV2>>,
    #[account(
        mut,
        seeds = [b"reward_pot".as_ref(), config.key().as_ref(), reward_mint.key().as_ref()],
        bump = bump_reward_pot
    )]
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

pub fn calc_reward<'info>(
    time_now: u64,
    user_state: &Account<'info, UserV2>,
    config: &Account<'info, StakingConfig>,
) -> u64 {
    // if you never stake, you should get nothing
    if user_state.time_last_stake == 0 {
        return 0;
    };
    // if the config has a 0 reward per sec
    if config.reward_per_sec == 0 {
        return 0;
    }
    let time_lock_end = user_state.time_staking_start + config.staking_lock_duration_in_sec;
    let time_last_interact = if user_state.time_last_stake > user_state.time_last_claim {
        user_state.time_last_stake
    } else {
        user_state.time_last_claim
    };
    msg!("time_now: {}", time_now);
    msg!("time_last_stake: {}", user_state.time_last_stake);
    msg!("time_last_claim: {}", user_state.time_last_claim);
    msg!("time_last_interact: {}", time_last_interact);
    msg!("time_lock_end: {}", time_lock_end);
    let mut new_reward: u64 = 0;
    // check current ts vs time last interact.
    // case 1: current ts && last interact are both before lock end
    // case 2: both are after lock end
    // case 3: last interact before lock end. current ts after lock end
    if time_last_interact < time_lock_end {
        if time_now < time_lock_end {
            // case 1
            msg!("calc reward w/ case 1");
            msg!("time using: {}", time_last_interact);
            let time_accrued = time_now.safe_sub(time_last_interact).unwrap();
            new_reward = new_reward
                .safe_add(calc_reward_internal(
                    config.reward_per_sec,
                    config.reward_denominator,
                    time_accrued,
                    user_state.nfts_staked,
                ))
                .unwrap();
        } else {
            // case 3
            msg!("calc reward w/ case 3");
            msg!("time using: {}", time_last_interact);
            let time_accrued_bef = time_lock_end.safe_sub(time_last_interact).unwrap();
            let reward_before = calc_reward_internal(
                config.reward_per_sec,
                config.reward_denominator,
                time_accrued_bef,
                user_state.nfts_staked,
            );
            new_reward = new_reward.safe_add(reward_before).unwrap();
            let time_accrued_aft = time_now.safe_sub(time_lock_end).unwrap();
            let reward_after = calc_reward_internal_1_igs(time_accrued_aft, user_state.nfts_staked);
            msg!(
                "reward_before: {} reward_after: {}",
                reward_before,
                reward_after
            );
            new_reward = new_reward.safe_add(reward_after).unwrap();
        }
    } else if time_now > time_lock_end {
        // case 2
        msg!("calc reward w/ case 2");
        msg!("time using: {}", time_last_interact);
        let time_accrued = time_now.safe_sub(time_last_interact).unwrap();
        new_reward = new_reward
            .safe_add(calc_reward_internal_1_igs(
                time_accrued,
                user_state.nfts_staked,
            ))
            .unwrap();
    } else {
        return 0;
    }
    msg!(
        "prev_reward: {} new_reward: {}",
        user_state.reward_stored,
        new_reward
    );
    new_reward.safe_add(user_state.reward_stored).unwrap()
}

fn calc_reward_internal(
    reward_per_sec: u64,
    reward_denominator: u64,
    time_accrued: u64,
    nfts_staked: u64,
) -> u64 {
    let reward_multiplied_by_time = reward_per_sec.safe_mul(time_accrued).unwrap();
    let reward_multiplied_by_all_nft = nfts_staked.safe_mul(reward_multiplied_by_time).unwrap();
    msg!(
        "reward cal (reward_per_sec * time_accrued * nfts_staked): {}*{}*{}={}",
        reward_per_sec,
        time_accrued,
        nfts_staked,
        reward_multiplied_by_all_nft
    );
    msg!("reward denominator: {}", reward_denominator);
    reward_multiplied_by_all_nft
        .safe_div(reward_denominator)
        .unwrap()
}

// 1 igs rate is 1157407/100000000000
fn calc_reward_internal_1_igs(time_accrued: u64, nfts_staked: u64) -> u64 {
    calc_reward_internal(1157407, 100000000000, time_accrued, nfts_staked)
}

pub fn handle_claim(ctx: Context<ClaimStakingReward>) -> Result<()> {
    let config = &ctx.accounts.config;
    let user_state = &ctx.accounts.user_state;

    if user_state.time_last_stake == 0 {
        return Err(error!(errors::ErrorCode::UserNeverStake));
    }

    let time_now = now_ts()?;
    let total_reward = calc_reward(time_now, user_state, config);
    msg!("total_reward: {}", total_reward);
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
