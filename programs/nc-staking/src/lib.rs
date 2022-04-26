use anchor_lang::prelude::*;
use anchor_spl::token::{self, Approve, Mint, Token, TokenAccount};

mod error;
mod mpl;

declare_id!("213MTwSbPbBzi8jH7xJ5aFC56j6DCnsAaBHFz98NNe8s");

const DELEGATE_PDA_SEED: &[u8] = b"delegate";

#[program]
pub mod nc_staking {
    use super::*;

    pub fn freeze(ctx: Context<Freeze>) -> Result<()> {
        let seeds = [
            &DELEGATE_PDA_SEED[..],
            ctx.accounts.token_account.to_account_info().key.as_ref(),
        ];
        let (_, bump) = Pubkey::find_program_address(&seeds, &id());

        // assign delegate to PDA
        // TODO: check that delegate key is equal pda?
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Approve {
            to: ctx.accounts.token_account.to_account_info(),
            delegate: ctx.accounts.delegate_auth.clone(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::approve(cpi_ctx, 1)?;

        // use pda to freeze
        let cpi_program = ctx.accounts.token_metadata_program.to_account_info();
        let cpi_accounts = mpl::FreezeDelegatedAccount {
            delegate: ctx.accounts.delegate_auth.clone(),
            token_account: ctx.accounts.token_account.clone(),
            edition: ctx.accounts.edition.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        };
        let auth_seeds = [
            &DELEGATE_PDA_SEED[..],
            ctx.accounts.token_account.to_account_info().key.as_ref(),
            &[bump],
        ];
        let signer = &[&auth_seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        mpl::freeze_delegated_account(cpi_ctx)?;
        msg!("freeze success");
        Ok(())
    }

    pub fn thaw(ctx: Context<Freeze>) -> Result<()> {
        let seeds = [
            &DELEGATE_PDA_SEED[..],
            ctx.accounts.token_account.to_account_info().key.as_ref(),
        ];
        let (_, bump) = Pubkey::find_program_address(&seeds, &id());

        // use pda to thaw
        let cpi_program = ctx.accounts.token_metadata_program.to_account_info();
        let cpi_accounts = mpl::FreezeDelegatedAccount {
            delegate: ctx.accounts.delegate_auth.clone(),
            token_account: ctx.accounts.token_account.clone(),
            edition: ctx.accounts.edition.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        };
        let auth_seeds = [
            &DELEGATE_PDA_SEED[..],
            ctx.accounts.token_account.to_account_info().key.as_ref(),
            &[bump],
        ];
        let signer = &[&auth_seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        mpl::thaw_delegated_account(cpi_ctx)?;
        msg!("thaw success");
        Ok(())
    }

    pub fn init_staking_acc(ctx: Context<InitStakingAccount>, json_data: String) -> Result<()> {
        if json_data.chars().count() < 2 {
            return Err(error::ErrorCode::JsonDataInvalid.into());
        }
        let staking_acc: &mut Account<StakingAccount> = &mut ctx.accounts.account;
        let authority: &Signer = &ctx.accounts.authority;
        let clock: Clock = Clock::get().unwrap();
        staking_acc.authority = *authority.key;
        staking_acc.timestamp = clock.unix_timestamp;
        staking_acc.staked_nft = 0;
        staking_acc.json_data = json_data;
        msg!("staking account created");
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>) -> Result<()> {
        let staking_acc: &mut Account<StakingAccount> = &mut ctx.accounts.account;
        let clock: Clock = Clock::get().unwrap();
        staking_acc.timestamp = clock.unix_timestamp;
        staking_acc.staked_nft = staking_acc.staked_nft + 1;
        msg!("staked 1 nft");
        Ok(())
    }

    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        // let authority: Signer = ctx.accounts.authority;
        let staking_acc: &mut Account<StakingAccount> = &mut ctx.accounts.account;
        // if staking_acc.owner != authority {
        //     return Err(error::ErrorCode::InvalidAuthority.into());
        // }
        if staking_acc.staked_nft < 1 {
            return Err(error::ErrorCode::CannotUnstake.into());
        }
        let clock: Clock = Clock::get().unwrap();
        staking_acc.timestamp = clock.unix_timestamp;
        staking_acc.staked_nft = staking_acc.staked_nft - 1;
        msg!("unstaked 1 nft");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Freeze<'info> {
    #[account(
        mut,
        token::authority = user,
        constraint = user.key == &token_account.owner
    )]
    token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    user: Signer<'info>,
    #[account(
        seeds=[DELEGATE_PDA_SEED, token_account.key().as_ref()],
        bump
    )]
    /// CHECK: PDA
    delegate_auth: AccountInfo<'info>,
    /// CHECK: PDA for metaplex; also freeze auth
    edition: AccountInfo<'info>,
    mint: Account<'info, Mint>,           // mint address
    token_program: Program<'info, Token>, // constraint here to check token program is legit
    token_metadata_program: Program<'info, mpl::TokenMetadata>, // constraint here to check token metadata program is legit
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitStakingAccount<'info> {
    #[account(init, payer = authority, space = StakingAccount::LEN)]
    pub account: Account<'info, StakingAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut, has_one = authority)]
    pub account: Account<'info, StakingAccount>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut, has_one = authority)]
    pub account: Account<'info, StakingAccount>,
    pub authority: Signer<'info>,
}

#[account]
pub struct StakingAccount {
    pub authority: Pubkey,
    pub timestamp: i64,
    pub staked_nft: i64,
    pub json_data: String,
}

const ACC_TYPE_DISCRIMINATOR_LENGTH: usize = 8;
const OWNER_PUBLIC_KEY_LENGTH: usize = 32;
const CREATED_TIMESTAMP_LENGTH: usize = 8;
const STAKED_NFT: usize = 8; // u64
const STRING_LENGTH_PREFIX: usize = 4;
const MAX_JSON_DATA_LENGTH: usize = 512 * 4; // 280 chars max.

impl StakingAccount {
    const LEN: usize = ACC_TYPE_DISCRIMINATOR_LENGTH
        + OWNER_PUBLIC_KEY_LENGTH // staking account owner / identity
        + CREATED_TIMESTAMP_LENGTH // account created timestamp
        + STAKED_NFT
        + STRING_LENGTH_PREFIX + MAX_JSON_DATA_LENGTH;
}
