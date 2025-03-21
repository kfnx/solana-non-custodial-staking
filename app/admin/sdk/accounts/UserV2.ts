/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from '@solana/web3.js'
import * as beet from '@metaplex-foundation/beet'
import * as beetSolana from '@metaplex-foundation/beet-solana'

/**
 * Arguments used to create {@link UserV2}
 * @category Accounts
 * @category generated
 */
export type UserV2Args = {
  user: web3.PublicKey
  config: web3.PublicKey
  rewardAccrued: beet.bignum
  rewardStored: beet.bignum
  timeLastStake: beet.bignum
  timeLastClaim: beet.bignum
  nftsStaked: beet.bignum
  timeStakingStart: beet.bignum
}

const userV2Discriminator = [198, 141, 185, 241, 224, 212, 165, 102]
/**
 * Holds the data for the {@link UserV2} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class UserV2 implements UserV2Args {
  private constructor(
    readonly user: web3.PublicKey,
    readonly config: web3.PublicKey,
    readonly rewardAccrued: beet.bignum,
    readonly rewardStored: beet.bignum,
    readonly timeLastStake: beet.bignum,
    readonly timeLastClaim: beet.bignum,
    readonly nftsStaked: beet.bignum,
    readonly timeStakingStart: beet.bignum
  ) {}

  /**
   * Creates a {@link UserV2} instance from the provided args.
   */
  static fromArgs(args: UserV2Args) {
    return new UserV2(
      args.user,
      args.config,
      args.rewardAccrued,
      args.rewardStored,
      args.timeLastStake,
      args.timeLastClaim,
      args.nftsStaked,
      args.timeStakingStart
    )
  }

  /**
   * Deserializes the {@link UserV2} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [UserV2, number] {
    return UserV2.deserialize(accountInfo.data, offset)
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link UserV2} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey
  ): Promise<UserV2> {
    const accountInfo = await connection.getAccountInfo(address)
    if (accountInfo == null) {
      throw new Error(`Unable to find UserV2 account at ${address}`)
    }
    return UserV2.fromAccountInfo(accountInfo, 0)[0]
  }

  /**
   * Deserializes the {@link UserV2} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [UserV2, number] {
    return userV2Beet.deserialize(buf, offset)
  }

  /**
   * Serializes the {@link UserV2} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return userV2Beet.serialize({
      accountDiscriminator: userV2Discriminator,
      ...this,
    })
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link UserV2}
   */
  static get byteSize() {
    return userV2Beet.byteSize
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link UserV2} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      UserV2.byteSize,
      commitment
    )
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link UserV2} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === UserV2.byteSize
  }

  /**
   * Returns a readable version of {@link UserV2} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      user: this.user.toBase58(),
      config: this.config.toBase58(),
      rewardAccrued: (() => {
        const x = <{ toNumber: () => number }>this.rewardAccrued
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      rewardStored: (() => {
        const x = <{ toNumber: () => number }>this.rewardStored
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      timeLastStake: (() => {
        const x = <{ toNumber: () => number }>this.timeLastStake
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      timeLastClaim: (() => {
        const x = <{ toNumber: () => number }>this.timeLastClaim
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      nftsStaked: (() => {
        const x = <{ toNumber: () => number }>this.nftsStaked
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
      timeStakingStart: (() => {
        const x = <{ toNumber: () => number }>this.timeStakingStart
        if (typeof x.toNumber === 'function') {
          try {
            return x.toNumber()
          } catch (_) {
            return x
          }
        }
        return x
      })(),
    }
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const userV2Beet = new beet.BeetStruct<
  UserV2,
  UserV2Args & {
    accountDiscriminator: number[] /* size: 8 */
  }
>(
  [
    ['accountDiscriminator', beet.uniformFixedSizeArray(beet.u8, 8)],
    ['user', beetSolana.publicKey],
    ['config', beetSolana.publicKey],
    ['rewardAccrued', beet.u64],
    ['rewardStored', beet.u64],
    ['timeLastStake', beet.u64],
    ['timeLastClaim', beet.u64],
    ['nftsStaked', beet.u64],
    ['timeStakingStart', beet.u64],
  ],
  UserV2.fromArgs,
  'UserV2'
)
