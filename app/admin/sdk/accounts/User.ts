/**
 * This code was GENERATED using the solita package.
 * Please DO NOT EDIT THIS FILE, instead rerun solita to update it or write a wrapper to add functionality.
 *
 * See: https://github.com/metaplex-foundation/solita
 */

import * as web3 from "@solana/web3.js";
import * as beet from "@metaplex-foundation/beet";
import * as beetSolana from "@metaplex-foundation/beet-solana";

/**
 * Arguments used to create {@link User}
 * @category Accounts
 * @category generated
 */
export type UserArgs = {
  user: web3.PublicKey;
  config: web3.PublicKey;
  rewardAccrued: beet.bignum;
  rewardStored: beet.bignum;
  timeLastStake: beet.bignum;
  timeLastClaim: beet.bignum;
  nftsStaked: beet.bignum;
};

const userDiscriminator = [159, 117, 95, 227, 239, 151, 58, 236];
/**
 * Holds the data for the {@link User} Account and provides de/serialization
 * functionality for that data
 *
 * @category Accounts
 * @category generated
 */
export class User implements UserArgs {
  private constructor(
    readonly user: web3.PublicKey,
    readonly config: web3.PublicKey,
    readonly rewardAccrued: beet.bignum,
    readonly rewardStored: beet.bignum,
    readonly timeLastStake: beet.bignum,
    readonly timeLastClaim: beet.bignum,
    readonly nftsStaked: beet.bignum
  ) {}

  /**
   * Creates a {@link User} instance from the provided args.
   */
  static fromArgs(args: UserArgs) {
    return new User(
      args.user,
      args.config,
      args.rewardAccrued,
      args.rewardStored,
      args.timeLastStake,
      args.timeLastClaim,
      args.nftsStaked
    );
  }

  /**
   * Deserializes the {@link User} from the data of the provided {@link web3.AccountInfo}.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static fromAccountInfo(
    accountInfo: web3.AccountInfo<Buffer>,
    offset = 0
  ): [User, number] {
    return User.deserialize(accountInfo.data, offset);
  }

  /**
   * Retrieves the account info from the provided address and deserializes
   * the {@link User} from its data.
   *
   * @throws Error if no account info is found at the address or if deserialization fails
   */
  static async fromAccountAddress(
    connection: web3.Connection,
    address: web3.PublicKey
  ): Promise<User> {
    const accountInfo = await connection.getAccountInfo(address);
    if (accountInfo == null) {
      throw new Error(`Unable to find User account at ${address}`);
    }
    return User.fromAccountInfo(accountInfo, 0)[0];
  }

  /**
   * Deserializes the {@link User} from the provided data Buffer.
   * @returns a tuple of the account data and the offset up to which the buffer was read to obtain it.
   */
  static deserialize(buf: Buffer, offset = 0): [User, number] {
    return userBeet.deserialize(buf, offset);
  }

  /**
   * Serializes the {@link User} into a Buffer.
   * @returns a tuple of the created Buffer and the offset up to which the buffer was written to store it.
   */
  serialize(): [Buffer, number] {
    return userBeet.serialize({
      accountDiscriminator: userDiscriminator,
      ...this,
    });
  }

  /**
   * Returns the byteSize of a {@link Buffer} holding the serialized data of
   * {@link User}
   */
  static get byteSize() {
    return userBeet.byteSize;
  }

  /**
   * Fetches the minimum balance needed to exempt an account holding
   * {@link User} data from rent
   *
   * @param connection used to retrieve the rent exemption information
   */
  static async getMinimumBalanceForRentExemption(
    connection: web3.Connection,
    commitment?: web3.Commitment
  ): Promise<number> {
    return connection.getMinimumBalanceForRentExemption(
      User.byteSize,
      commitment
    );
  }

  /**
   * Determines if the provided {@link Buffer} has the correct byte size to
   * hold {@link User} data.
   */
  static hasCorrectByteSize(buf: Buffer, offset = 0) {
    return buf.byteLength - offset === User.byteSize;
  }

  /**
   * Returns a readable version of {@link User} properties
   * and can be used to convert to JSON and/or logging
   */
  pretty() {
    return {
      user: this.user.toBase58(),
      config: this.config.toBase58(),
      rewardAccrued: (() => {
        const x = <{ toNumber: () => number }>this.rewardAccrued;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      rewardStored: (() => {
        const x = <{ toNumber: () => number }>this.rewardStored;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      timeLastStake: (() => {
        const x = <{ toNumber: () => number }>this.timeLastStake;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      timeLastClaim: (() => {
        const x = <{ toNumber: () => number }>this.timeLastClaim;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
      nftsStaked: (() => {
        const x = <{ toNumber: () => number }>this.nftsStaked;
        if (typeof x.toNumber === "function") {
          try {
            return x.toNumber();
          } catch (_) {
            return x;
          }
        }
        return x;
      })(),
    };
  }
}

/**
 * @category Accounts
 * @category generated
 */
export const userBeet = new beet.BeetStruct<
  User,
  UserArgs & {
    accountDiscriminator: number[] /* size: 8 */;
  }
>(
  [
    ["accountDiscriminator", beet.uniformFixedSizeArray(beet.u8, 8)],
    ["user", beetSolana.publicKey],
    ["config", beetSolana.publicKey],
    ["rewardAccrued", beet.u64],
    ["rewardStored", beet.u64],
    ["timeLastStake", beet.u64],
    ["timeLastClaim", beet.u64],
    ["nftsStaked", beet.u64],
  ],
  User.fromArgs,
  "User"
);
