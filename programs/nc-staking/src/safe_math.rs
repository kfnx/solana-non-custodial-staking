use anchor_lang::prelude::*;
use crate::errors::ErrorCode;

pub trait SafeMath {
  type Output;

  fn safe_add(&self, rhs: Self::Output) -> Result<Self::Output>;
  fn safe_sub(&self, rhs: Self::Output) -> Result<Self::Output>;
  fn safe_div(&self, rhs: Self::Output) -> Result<Self::Output>;
  fn safe_mul(&self, rhs: Self::Output) -> Result<Self::Output>;
  fn safe_pow(&self, exp: u32) -> Result<Self::Output>;
}

macro_rules! safe_math {
  ($type: ident) => {
    /// $type implementation of the SafeMath trait
    impl SafeMath for $type {
      type Output = $type;

      fn safe_add(&self, rhs: Self::Output) -> Result<Self::Output> {
        match self.checked_add(rhs) {
          Some(result) => Ok(result),
          None => return Err(ErrorCode::Overflow.into())
        }
      }
    
      fn safe_sub(&self, rhs: Self::Output) -> Result<Self::Output> {
        match self.checked_sub(rhs) {
          Some(result) => Ok(result),
          None => return Err(ErrorCode::Underflow.into())
        }
      }

      fn safe_mul(&self, rhs: Self::Output) -> Result<Self::Output> {
        match self.checked_mul(rhs) {
          Some(result) => Ok(result),
          None => return Err(ErrorCode::Underflow.into())
        }
      }

      fn safe_div(&self, rhs: Self::Output) -> Result<Self::Output> {
        match self.checked_div(rhs) {
          Some(result) => Ok(result),
          None => return Err(ErrorCode::DivisionByZero.into())
        }
      }

      fn safe_pow(&self, exp: u32) -> Result<Self::Output> {
        match self.checked_pow(exp) {
          Some(result) => Ok(result),
          None => return Err(error!(ErrorCode::Overflow))
        }
      }
    }
  }
}

safe_math!(u128);
safe_math!(u64);
safe_math!(u32);
safe_math!(u16);
safe_math!(u8);