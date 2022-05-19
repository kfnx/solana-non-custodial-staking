/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as beet from '@metaplex-foundation/beet'
import * as web3 from '@solana/web3.js'

/**
 * @category Instructions
 * @category AddWhitelist
 * @category generated
 */
export const addWhitelistStruct = new beet.BeetArgsStruct<{
  instructionDiscriminator: number[] /* size: 8 */
}>(
  [['instructionDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)]],
  'AddWhitelistInstructionArgs'
)
/**
 * Accounts required by the _addWhitelist_ instruction
 *
 * @property [_writable_, **signer**] admin
 * @property [_writable_] config
 * @property [] creatorAddressToWhitelist
 * @property [_writable_] whitelist
 * @category Instructions
 * @category AddWhitelist
 * @category generated
 */
export type AddWhitelistInstructionAccounts = {
  admin: web3.PublicKey
  config: web3.PublicKey
  creatorAddressToWhitelist: web3.PublicKey
  whitelist: web3.PublicKey
}

export const addWhitelistInstructionDiscriminator = [
  215, 46, 143, 176, 108, 113, 24, 1,
]

/**
 * Creates a _AddWhitelist_ instruction.
 *
 * @param accounts that will be accessed while the instruction is processed
 * @category Instructions
 * @category AddWhitelist
 * @category generated
 */
export function createAddWhitelistInstruction(
  accounts: AddWhitelistInstructionAccounts
) {
  const { admin, config, creatorAddressToWhitelist, whitelist } = accounts

  const [data] = addWhitelistStruct.serialize({
    instructionDiscriminator: addWhitelistInstructionDiscriminator,
  })
  const keys: web3.AccountMeta[] = [
    {
      pubkey: admin,
      isWritable: true,
      isSigner: true,
    },
    {
      pubkey: config,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: creatorAddressToWhitelist,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: whitelist,
      isWritable: true,
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
