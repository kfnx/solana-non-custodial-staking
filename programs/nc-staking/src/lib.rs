use crate::instructions::*;
use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod mpl;
pub mod state;

declare_id!("stakEUMMv9bRHYX4CyVY48i19ViBdNSzn8Rt1a1Fi6E");

#[program]
pub mod nc_staking {
    use super::*;

    pub fn init_staking_vault(ctx: Context<InitStakingVault>) -> Result<()> {
        instructions::init_staking_vault::handler(ctx)
    }

    // to be removed once merged with stake
    pub fn freeze(ctx: Context<Freeze>) -> Result<()> {
        instructions::freeze::handler(ctx)
    }
    
    // to be removed once merged with unstake
    pub fn thaw(ctx: Context<Thaw>) -> Result<()> {
        instructions::thaw::handler(ctx)
    }

    pub fn stake(ctx: Context<Stake>) -> Result<()> {
        instructions::stake::handler(ctx)
    }

    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        instructions::unstake::handler(ctx)
    }
}
