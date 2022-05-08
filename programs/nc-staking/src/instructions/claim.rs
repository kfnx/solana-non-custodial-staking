// use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
// #[instruction(bump_auth: u8, bump_farmer: u8, bump_pot_a: u8, bump_pot_b: u8)]
pub struct ClaimStakingReward<'info> {
    // #[account(mut)]
    // pub staking_config: Account<'info, StakingConfig>,
    // /// CHECK:
    // #[account(seeds = [staking_config.key().as_ref()], bump)]
    // pub staking_config_authority: AccountInfo<'info>,
    #[account(mut)]
    pub user: Signer<'info>,

    // pub reward_mint: Account<'info, Mint>,
    // #[account(mut, seeds = [b"reward_pot".as_ref(), staking_config.key().as_ref(), reward_mint.key().as_ref()], bump)]
    #[account(mut)]
    pub reward_from_ata: Account<'info, TokenAccount>,
    // #[account(init_if_needed, associated_token::mint = reward_mint, associated_token::authority = user, payer = user)]
    #[account(mut)]
    pub reward_to_ata: Account<'info, TokenAccount>,

    // programs
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> ClaimStakingReward<'info> {
    fn transfer_token_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.reward_from_ata.to_account_info(),
                to: self.reward_to_ata.to_account_info(),
                // authority: self.staking_config_authority.to_account_info(),
                authority: self.user.to_account_info(),
            },
        )
    }
}

pub fn handler(ctx: Context<ClaimStakingReward>) -> Result<()> {
    let user: &Signer = &ctx.accounts.user;
    let to_claim_reward_amount: u64 = 20;
    // let ix = spl_token::instruction::transfer(
    //     token_program.key,
    //     source.key,
    //     destination.key,
    //     authority.key,
    //     &[],
    //     amount,
    // )?;
    // invoke(
    //     &ix,
    //     &[source, destination, authority, token_program],
    // )

    token::transfer(
        ctx.accounts.transfer_token_ctx(),
        // ctx.accounts
        //     .transfer_token_ctx()
        //     .with_signer(&[&ctx.accounts.staking_config.seeds()]),
        to_claim_reward_amount,
    )?;
    msg!(
        "instruction handler: ClaimStakingReward. user: {}",
        user.key()
    );
    Ok(())
}
