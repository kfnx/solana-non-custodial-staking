/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as splToken from '@solana/spl-token'
import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category Unstake
 * @category generated
 */
export const unstakeStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'UnstakeInstructionArgs'
)
/**
 * Accounts required by the _unstake_ instruction
 *
 * @property [_writable_, **signer**] user
 * @property [_writable_] userState
 * @property [_writable_] config
 * @property [_writable_] stakeInfo
 * @property [_writable_] tokenAccount
 * @property [] delegate
 * @property [] edition
 * @property [] mint
 * @property [] tokenMetadataProgram
 * @category Instructions
 * @category Unstake
 * @category generated
 */
export type UnstakeInstructionAccounts = {
  user: web3.PublicKey
  userState: web3.PublicKey
  config: web3.PublicKey
  stakeInfo: web3.PublicKey
  tokenAccount: web3.PublicKey
  delegate: web3.PublicKey
  edition: web3.PublicKey
  mint: web3.PublicKey
  tokenMetadataProgram: web3.PublicKey
}

export const unstakeInstructionDiscriminator = [
  90, 95, 107, 42, 205, 124, 50, 225,
]

/**
 * Creates a _Unstake_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category Unstake
 * @category generated
 */
export function createUnstakeInstruction(accounts: UnstakeInstructionAccounts) {
  const {
    user,
    userState,
    config,
    stakeInfo,
    tokenAccount,
    delegate,
    edition,
    mint,
    tokenMetadataProgram,
  } = accounts

  const [data] = unstakeStruct.serialize({
    instructionDiscriminator: unstakeInstructionDiscriminator,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: user,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: userState,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: config,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: stakeInfo,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: tokenAccount,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: delegate,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: edition,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: mint,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: splToken.TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: tokenMetadataProgram,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
  ]

  const ix = new web3.TransactionInstruction({
    programId: new web3.PublicKey(
      'stakEUMMv9bRHYX4CyVY48i19ViBdNSzn8Rt1a1Fi6E'
    ),
    keys,
    data,
  })
  return ix
}
