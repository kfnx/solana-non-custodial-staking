use crate::{claim::calc_reward, errors::ErrorCode, mpl, state::*, utils::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Approve, Mint, Token, TokenAccount};
use metaplex_token_metadata::state::Metadata;
use std::str::FromStr;

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, has_one = user)]
    pub user_state: Account<'info, User>,
    #[account(mut)]
    pub config: Account<'info, StakingConfig>,
    #[account(
        init_if_needed,
        seeds = [b"stake_info".as_ref(), user.key().as_ref(), mint.key().as_ref()],
        bump,
        payer = user,
        space = 8 + std::mem::size_of::<StakeInfo>()
    )]
    pub stake_info: Account<'info, StakeInfo>,
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
    /// CHECK: only used for CPI, PDA for metaplex; also freeze auth
    edition: AccountInfo<'info>,
    mint: Account<'info, Mint>,
    token_program: Program<'info, Token>, // constraint here to check token program is legit
    token_metadata_program: Program<'info, mpl::TokenMetadata>, // constraint here to check token metadata program is legit
    system_program: Program<'info, System>, // probably unneeded here; no init in freeze
}

impl<'info> Stake<'info> {
    fn approve_delegate_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Approve<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Approve {
                to: self.token_account.to_account_info(),
                delegate: self.delegate.clone(),
                authority: self.user.to_account_info(),
            },
        )
    }
}

fn assert_valid_metadata(
    metadata: &AccountInfo,
    mint: &Pubkey,
) -> core::result::Result<Metadata, ProgramError> {
    let metadata_program = Pubkey::from_str("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").unwrap();

    // 1 verify the owner of the account is metaplex's metadata program
    assert_eq!(metadata.owner, &metadata_program);

    // 2 verify the PDA seeds match
    let seed = &[
        b"metadata".as_ref(),
        metadata_program.as_ref(),
        mint.as_ref(),
    ];

    let (metadata_addr, _bump) = Pubkey::find_program_address(seed, &metadata_program);
    assert_eq!(metadata_addr, metadata.key());

    Metadata::from_account_info(metadata)
}

fn assert_whitelist(ctx: &Context<Stake>) -> Result<()> {
    let config = &ctx.accounts.config;
    let mint = &ctx.accounts.mint;
    let remaining_accs = &mut ctx.remaining_accounts.iter();
    let metadata_info = next_account_info(remaining_accs)?;

    // verify metadata is legit
    let metadata = assert_valid_metadata(metadata_info, &mint.key())?;
    // metaplex constraints this to max 5, so won't go crazy on compute
    // (empirical testing showed there's practically 0 diff between stopping at 0th and 5th creator)
    for creator in &metadata.data.creators.unwrap() {
        // verify creator actually signed off on this nft
        if !creator.verified {
            continue;
        }

        // check if creator is whitelisted, returns an error if not
        let attempted_proof = &config.creator_whitelist.key() == &creator.address;

        if attempted_proof {
            return Ok(());
        } else {
            continue;
        }
    }

    // if conditions above failed, it means nothing is Ok(()), then verification failed
    Err(error!(ErrorCode::NotWhitelisted))
}

pub fn handler(ctx: Context<Stake>) -> Result<()> {
    assert_whitelist(&ctx)?;

    // assign delegate to PDA
    let cpi_ctx = ctx.accounts.approve_delegate_ctx();
    token::approve(cpi_ctx, 1)?;
    msg!(
        "Approve token delegate with key: {}",
        ctx.accounts.delegate.key()
    );

    // use pda to freeze
    let mpl_helper = mpl::FreezeOrThawDelegatedAccount {
        delegate: ctx.accounts.delegate.clone(),
        token_account: ctx.accounts.token_account.clone(),
        edition: ctx.accounts.edition.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        token_metadata_program: ctx.accounts.token_metadata_program.clone(),
    };
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

    mpl_helper.freeze_or_thaw(true, &auth_seeds)?;
    msg!("Instruction handler: Freeze");

    let user_state = &mut ctx.accounts.user_state;
    let user = *ctx.accounts.user.to_account_info().key;

    if user_state.user != user {
        return Err(error!(ErrorCode::InvalidUserState));
    }

    let config = &mut ctx.accounts.config;
    config.nfts_staked = config.nfts_staked.checked_add(1).unwrap();

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
    user_state.nfts_staked = user_state.nfts_staked.checked_add(1).unwrap();
    user_state.reward_stored = total_reward;
    msg!("reward stored: {}", user_state.reward_stored);
    user_state.time_last_stake = time_now;

    // add active stakers when a user initially stake their first NFT
    if user_state.nfts_staked == 1 {
        config.active_stakers = config.active_stakers.checked_add(1).unwrap();
    }

    let stake_info = &mut *ctx.accounts.stake_info;
    stake_info.time_staking_start = time_now;
    stake_info.config = ctx.accounts.config.key();
    msg!("Instruction handler: Stake");
    Ok(())
}
