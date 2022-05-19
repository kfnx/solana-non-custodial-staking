use crate::{errors, state::*, utils::now_ts};
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
    pub config: Account<'info, StakingConfig>,
    /// CHECK:
    #[account(seeds = [b"config", config.key().as_ref()], bump = bump_config_auth)]
    pub config_authority: AccountInfo<'info>,
    #[account(mut)]
    pub user_state: Account<'info, User>,

    #[account(mut, seeds = [b"reward_pot".as_ref(), config.key().as_ref(), reward_mint.key().as_ref()], bump = bump_reward_pot)]
    pub reward_pot: Account<'info, TokenAccount>,
    pub reward_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        associated_token::mint = reward_mint,
        associated_token::authority = user,
        payer = user
    )]
    pub reward_destination: Account<'info, TokenAccount>,

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

pub fn handler(ctx: Context<ClaimStakingReward>) -> Result<()> {
    let config = &ctx.accounts.config;
    let user_state = &ctx.accounts.user_state;

    // transfer
    let time_accrued = {
        if user_state.last_stake_time == 0 {
            return Err(error!(errors::ErrorCode::UserNeverStake));
        }
        now_ts()? - user_state.last_stake_time
    };
    let reward_amount = config.reward_rate * time_accrued;
    token::transfer(
        ctx.accounts
            .transfer_reward_token_ctx()
            .with_signer(&[&config.auth_seeds()]),
        reward_amount,
    )?;

    // record changes
    let config = &mut ctx.accounts.config;
    config.reward_accrued = config.reward_accrued + reward_amount;
    let user_state = &mut ctx.accounts.user_state;
    user_state.reward_accrued = user_state.reward_accrued + reward_amount;
    user_state.time_last_claim = now_ts()?;

    msg!("instruction handler: ClaimStakingReward. user");
    Ok(())
}
