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
 * @category Claim
 * @category generated
 */
export type ClaimInstructionArgs = {
  bumpConfigAuth: number
  bumpRewardPot: number
}
/**
 * @category Instructions
 * @category Claim
 * @category generated
 */
export const claimStruct = new beet.BeetArgsStruct<
  ClaimInstructionArgs & {
    instructionDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['bumpConfigAuth', beet.u8],
    ['bumpRewardPot', beet.u8],
  ],
  'ClaimInstructionArgs'
)
/**
 * Accounts required by the _claim_ instruction
 *
 * @property [_writable_, **signer**] user
 * @property [_writable_] config
 * @property [] configAuthority
 * @property [_writable_] userState
 * @property [_writable_] rewardPot
 * @property [] rewardMint
 * @property [_writable_] rewardDestination
 * @property [] associatedTokenProgram
 * @category Instructions
 * @category Claim
 * @category generated
 */
export type ClaimInstructionAccounts = {
  user: web3.PublicKey
  config: web3.PublicKey
  configAuthority: web3.PublicKey
  userState: web3.PublicKey
  rewardPot: web3.PublicKey
  rewardMint: web3.PublicKey
  rewardDestination: web3.PublicKey
  associatedTokenProgram: web3.PublicKey
}

export const claimInstructionDiscriminator = [
  62, 198, 214, 193, 213, 159, 108, 210,
]

/**
 * Creates a _Claim_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @param args to provide as instruction data to the program
 *
 * @category Instructions
 * @category Claim
 * @category generated
 */
export function createClaimInstruction(
  accounts: ClaimInstructionAccounts,
  args: ClaimInstructionArgs
) {
  const {
    user,
    config,
    configAuthority,
    userState,
    rewardPot,
    rewardMint,
    rewardDestination,
    associatedTokenProgram,
  } = accounts

  const [data] = claimStruct.serialize({
    instructionDiscriminator: claimInstructionDiscriminator,
    ...args,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: user,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: config,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: configAuthority,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: userState,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: rewardPot,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: rewardMint,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: rewardDestination,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: splToken.TOKEN_PROGRAM_ID,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: associatedTokenProgram,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: web3.SystemProgram.programId,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: web3.SYSVAR_RENT_PUBKEY,
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
