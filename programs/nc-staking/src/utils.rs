use crate::{errors::ErrorCode, safe_math::*};
use anchor_lang::{__private::CLOSED_ACCOUNT_DISCRIMINATOR, prelude::*, solana_program::clock};
use std::convert::TryInto;
use std::io::Write;

pub fn now_ts() -> Result<u64> {
    //i64 -> u64 ok to unwrap
    Ok(clock::Clock::get()?.unix_timestamp.try_into().unwrap())
}

// https://github.com/gemworks/gem-farm/blob/main/lib/gem_common/src/account.rs
pub fn close_account(
    pda_to_close: &mut AccountInfo,
    sol_destination: &mut AccountInfo,
) -> Result<()> {
    // Transfer tokens from the account to the sol_destination.
    let dest_starting_lamports = sol_destination.lamports();
    **sol_destination.lamports.borrow_mut() =
        dest_starting_lamports.safe_add(pda_to_close.lamports())?;
    **pda_to_close.lamports.borrow_mut() = 0;

    // Mark the account discriminator as closed.
    let mut data = pda_to_close.try_borrow_mut_data()?;
    let dst: &mut [u8] = &mut data;
    let mut cursor = std::io::Cursor::new(dst);
    cursor
        .write_all(&CLOSED_ACCOUNT_DISCRIMINATOR)
        .map_err(|_| error!(ErrorCode::AnchorSerializationIssue))?;
    Ok(())
}
