use crate::{errors, safe_math::SafeMath, state::*, utils::now_ts};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use std::convert::TryFrom;

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
    nfts_staked: u64,
    reward_per_sec: u64,
    reward_denominator: u64,
    time_accrued: u64,
) -> u64 {
    msg!("time_accrued: {}", time_accrued);
    let reward_per_sec = u64::try_from(reward_per_sec).unwrap();
    msg!("reward_per_sec: {}", reward_per_sec);
    let reward_denominator = u64::try_from(reward_denominator).unwrap();
    msg!("reward_denominator: {}", reward_denominator);
    let nfts_staked = u64::try_from(nfts_staked).unwrap();
    msg!("nfts_staked: {}", nfts_staked);

    let reward_multiplied_by_time = reward_per_sec.safe_mul(time_accrued).unwrap();
    msg!("reward * time: {}", reward_multiplied_by_time);
    let reward_multiplied_by_all_nft = nfts_staked.safe_mul(reward_multiplied_by_time).unwrap();
    msg!("reward * time * nft: {}", reward_multiplied_by_all_nft);
    let total_reward = u64::try_from(
        reward_multiplied_by_all_nft
            .safe_div(reward_denominator)
            .unwrap(),
    )
    .unwrap();
    msg!("total_reward: {}", total_reward);
    return total_reward;
}

pub fn handler(ctx: Context<ClaimStakingReward>) -> Result<()> {
    let config = &ctx.accounts.config;
    let user_state = &ctx.accounts.user_state;

    let time_accrued = {
        if user_state.time_last_stake == 0 {
            return Err(error!(errors::ErrorCode::UserNeverStake));
        }
        u64::try_from(now_ts()?.safe_sub(user_state.time_last_stake)?).unwrap()
    };

    let total_reward_denominated = calc_reward(
        user_state.nfts_staked,
        config.reward_per_sec,
        config.reward_denominator,
        time_accrued,
    );

    token::transfer(
        ctx.accounts
            .transfer_reward_token_ctx()
            .with_signer(&[&config.auth_seeds()]),
        total_reward_denominated,
    )?;

    // record changes
    let config = &mut ctx.accounts.config;
    config.reward_accrued = config.reward_accrued + total_reward_denominated;
    let user_state = &mut ctx.accounts.user_state;
    user_state.reward_accrued = user_state.reward_accrued + total_reward_denominated;
    user_state.time_last_claim = now_ts()?;

    msg!("instruction handler: ClaimStakingReward");
    Ok(())
}
