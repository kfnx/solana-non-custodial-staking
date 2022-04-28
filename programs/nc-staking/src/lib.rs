use anchor_lang::prelude::*;
use anchor_spl::token::{self, Approve, Mint, Token, TokenAccount};

mod error;
mod mpl;
mod utils;

declare_id!("213MTwSbPbBzi8jH7xJ5aFC56j6DCnsAaBHFz98NNe8s");

const DELEGATE_PDA_SEED: &[u8] = b"delegate";

#[program]
pub mod nc_staking {
    use super::*;

    pub fn init_staking_vault(ctx: Context<InitStakingVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let owner: &Signer = &ctx.accounts.owner;
        vault.owner = *owner.key;
        vault.total_staked = 0;
        msg!("staking account created");
        Ok(())
    }

    pub fn freeze(ctx: Context<Freeze>) -> Result<()> {
        let seeds = [
            &DELEGATE_PDA_SEED[..],
            ctx.accounts.token_account.to_account_info().key.as_ref(),
        ];
        let (_, bump) = Pubkey::find_program_address(&seeds, &id());
        // assign delegate to PDA
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
        msg!("thaw success");
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let owner = *ctx.accounts.owner.to_account_info().key;

        if vault.owner != owner {
            return Err(error::ErrorCode::InvalidVaultOwner.into());
        }
        vault.total_staked = vault.total_staked + 1;
        msg!("staked 1 nft");
        Ok(())
    }

    pub fn unstake(ctx: Context<Stake>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let owner = *ctx.accounts.owner.to_account_info().key;

        if vault.owner != owner {
            return Err(error::ErrorCode::InvalidVaultOwner.into());
        }
        if vault.total_staked < 1 {
            return Err(error::ErrorCode::EmptyVault.into());
        }
        vault.total_staked = vault.total_staked - 1;
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
    token_metadata_program: Program<'info, utils::TokenMetadata>, // constraint here to check token metadata program is legit
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitStakingVault<'info> {
    #[account(
        init,
        payer=owner,
        space = 8 + std::mem::size_of::<Vault>(),
        seeds=[
          b"vault",
          owner.to_account_info().key.as_ref()
        ],
        bump,
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut, has_one = owner)]
    pub vault: Account<'info, Vault>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut, has_one = owner)]
    pub vault: Account<'info, Vault>,
    pub owner: Signer<'info>,
}

#[account]
pub struct ProgramState {
    pub total_active_stakers: i64,
    pub total_nft_staked: i64,
}

#[account]
pub struct Vault {
    pub owner: Pubkey,
    pub time_created: i64,
    pub total_staked: i64,
}
