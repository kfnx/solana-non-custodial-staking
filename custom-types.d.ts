import {
  Account,
  Commitment,
  ConfirmOptions,
  Connection,
  PublicKey,
  Signer,
  TransactionInstruction,
  TransactionSignature,
} from "@solana/web3.js";

/**
 * We override some type for @solana/spl-token
 * because stupid type resolver somehow consume types of @solana/spl-token from @metaplex/js child deps
 * which use @solana/spl-token@0.1.8 that have none of getOrCreateAssociatedTokenAccount, transfer, Account, etc (only after v0.2.0 those are added)
 * will remove this type extension after metaplex update their @solana/spl-token@0.2.0
 */
declare module "@solana/spl-token" {
  export interface Account {
    /** Address of the account */
    address: PublicKey;
    /** Mint associated with the account */
    mint: PublicKey;
    /** Owner of the account */
    owner: PublicKey;
    /** Number of tokens the account holds */
    amount: bigint;
    /** Authority that can transfer tokens from the account */
    delegate: PublicKey | null;
    /** Number of tokens the delegate is authorized to transfer */
    delegatedAmount: bigint;
    /** True if the account is initialized */
    isInitialized: boolean;
    /** True if the account is frozen */
    isFrozen: boolean;
    /** True if the account is a native token account */
    isNative: boolean;
    /**
     * If the account is a native token account, it must be rent-exempt. The rent-exempt reserve is the amount that must
     * remain in the balance until the account is closed.
     */
    rentExemptReserve: bigint | null;
    /** Optional authority to close the account */
    closeAuthority: PublicKey | null;
    tlvData: Buffer;
  }

  /**
   * Retrieve the associated token account, or create it if it doesn't exist
   *
   * @param connection               Connection to use
   * @param payer                    Payer of the transaction and initialization fees
   * @param mint                     Mint associated with the account to set or verify
   * @param owner                    Owner of the account to set or verify
   * @param allowOwnerOffCurve       Allow the owner account to be a PDA (Program Derived Address)
   * @param commitment               Desired level of commitment for querying the state
   * @param confirmOptions           Options for confirming the transaction
   * @param programId                SPL Token program account
   * @param associatedTokenProgramId SPL Associated Token program account
   *
   * @return Address of the new associated token account
   */
  export function getOrCreateAssociatedTokenAccount(
    connection: Connection,
    payer: Signer,
    mint: PublicKey,
    owner: PublicKey,
    allowOwnerOffCurve?: boolean,
    commitment?: Commitment,
    confirmOptions?: ConfirmOptions,
    programId?: PublicKey,
    associatedTokenProgramId?: PublicKey
  ): Promise<Account>;

  /**
   * Transfer tokens from one account to another
   *
   * @param connection     Connection to use
   * @param payer          Payer of the transaction fees
   * @param source         Source account
   * @param destination    Destination account
   * @param owner          Owner of the source account
   * @param amount         Number of tokens to transfer
   * @param multiSigners   Signing accounts if `owner` is a multisig
   * @param confirmOptions Options for confirming the transaction
   * @param programId      SPL Token program account
   *
   * @return Signature of the confirmed transaction
   */
  export function transfer(
    connection: Connection,
    payer: Signer,
    source: PublicKey,
    destination: PublicKey,
    owner: Signer | PublicKey,
    amount: number | bigint,
    multiSigners?: Signer[],
    confirmOptions?: ConfirmOptions,
    programId?: PublicKey
  ): Promise<TransactionSignature>;

  /**
   * Construct an InitializeMint instruction
   *
   * @param mint            Token mint account
   * @param decimals        Number of decimals in token account amounts
   * @param mintAuthority   Minting authority
   * @param freezeAuthority Optional authority that can freeze token accounts
   * @param programId       SPL Token program account
   *
   * @return Instruction to add to a transaction
   */
  export function createInitializeMintInstruction(
    mint: PublicKey,
    decimals: number,
    mintAuthority: PublicKey,
    freezeAuthority: PublicKey | null,
    programId?: PublicKey
  ): TransactionInstruction;

  /** Get the minimum lamport balance for a mint to be rent exempt
   *
   * @param connection Connection to use
   * @param commitment Desired level of commitment for querying the state
   *
   * @return Amount of lamports required
   */
  export function getMinimumBalanceForRentExemptMint(
    connection: Connection,
    commitment?: Commitment
  ): Promise<number>;

  /**
   * Construct a MintTo instruction
   *
   * @param mint         Public key of the mint
   * @param destination  Address of the token account to mint to
   * @param authority    The mint authority
   * @param amount       Amount to mint
   * @param multiSigners Signing accounts if `authority` is a multisig
   * @param programId    SPL Token program account
   *
   * @return Instruction to add to a transaction
   */
  export function createMintToInstruction(
    mint: PublicKey,
    destination: PublicKey,
    authority: PublicKey,
    amount: number | bigint,
    multiSigners?: Signer[],
    programId?: PublicKey
  ): TransactionInstruction;

  /**
   * Get the address of the associated token account for a given mint and owner
   *
   * @param mint                     Token mint account
   * @param owner                    Owner of the new account
   * @param allowOwnerOffCurve       Allow the owner account to be a PDA (Program Derived Address)
   * @param programId                SPL Token program account
   * @param associatedTokenProgramId SPL Associated Token program account
   *
   * @return Address of the associated token account
   */
  export function getAssociatedTokenAddress(
    mint: PublicKey,
    owner: PublicKey,
    allowOwnerOffCurve?: boolean,
    programId?: PublicKey,
    associatedTokenProgramId?: PublicKey
  ): Promise<PublicKey>;
}
