import * as anchor from "@project-serum/anchor";
import {
  getMinimumBalanceForRentExemptMint,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  transfer,
  createInitializeMintInstruction,
  MintLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import { NcStaking } from "../../target/types/nc_staking";
import {
  findConfigAuthorityPDA,
  findDelegateAuthPDA,
  findEditionPDA,
  findMetadataPDA,
  findRewardPotPDA,
  findStakeInfoPDA,
  findUserStatePDA,
} from "./pda";
import { TOKEN_METADATA_PROGRAM_ID } from "./program-id";
import { createUser, findUserATA, getTokenBalanceByATA, User } from "./user";

export async function stake(
  program: anchor.Program<NcStaking>,
  user: User,
  config: PublicKey,
  mint: PublicKey
) {
  const userId = user.wallet.publicKey;
  const tokenAccount = await findUserATA(userId, mint);
  // console.log("user ATA", userATA.toBase58());
  const [delegate] = await findDelegateAuthPDA(tokenAccount);
  // console.log("user delegate", delegate.toBase58());
  const [edition] = await findEditionPDA(mint);
  // console.log("edition", edition.toBase58());
  const [userState] = await findUserStatePDA(userId, config);
  // console.log("user state", userState.toBase58());
  const [stakeInfo] = await findStakeInfoPDA(userId, mint);
  // console.log("stakeInfo", stakeInfo.toBase58());
  const metadata = await findMetadataPDA(mint);
  // console.log("metadata", metadata.toBase58());

  const tx = await program.methods
    .stake()
    .accounts({
      user: userId,
      stakeInfo,
      config,
      mint,
      tokenAccount,
      userState,
      delegate,
      edition,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    })
    .remainingAccounts([
      {
        pubkey: metadata,
        isWritable: false,
        isSigner: false,
      },
    ])
    .signers([user.keypair])
    .rpc();
  return tx;
}

export async function unstake(
  program: anchor.Program<NcStaking>,
  user: User,
  config: PublicKey,
  mint: PublicKey
) {
  const userId = user.wallet.publicKey;
  const tokenAccount = await findUserATA(userId, mint);
  // console.log("user ATA", userATA.toBase58());
  const [delegate] = await findDelegateAuthPDA(tokenAccount);
  // console.log("user delegate", delegate.toBase58());
  const [edition] = await findEditionPDA(mint);
  // console.log("edition", edition.toBase58());
  const [userState] = await findUserStatePDA(userId, config);
  // console.log("user state", userState.toBase58());
  const [stakeInfo] = await findStakeInfoPDA(userId, mint);
  // console.log("stakeInfo", stakeInfo.toBase58());

  const tx = await program.methods
    .unstake()
    .accounts({
      user: userId,
      stakeInfo,
      config,
      mint,
      tokenAccount,
      userState,
      delegate,
      edition,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    })
    .signers([user.keypair])
    .rpc();
  return tx;
}

export async function claim(
  program: anchor.Program<NcStaking>,
  user: User,
  config: PublicKey,
  rewardMint: PublicKey
) {
  try {
    const userId = user.wallet.publicKey;
    const [configAuth, configAuthBump] = await findConfigAuthorityPDA(config);
    // console.log("configAuth", configAuth.toBase58());
    const [rewardPot, rewardPotBump] = await findRewardPotPDA(
      config,
      rewardMint
    );
    // console.log("reward pot", rewardPot.toBase58());
    const userATA = await findUserATA(userId, rewardMint);
    // console.log("userATA", userATA.toBase58());
    const [userState] = await findUserStatePDA(userId, config);
    // console.log("userState", userState.toBase58());

    const tx = await program.methods
      .claim(configAuthBump, rewardPotBump)
      .accounts({
        user: userId,
        userState,
        config: config,
        configAuthority: configAuth,
        rewardDestination: userATA,
        rewardMint: rewardMint,
        rewardPot: rewardPot,

        // programs
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([user.keypair])
      .rpc();
    return tx;
  } catch (error) {
    console.error(error);
  }
}

export async function createToken(
  creator: Keypair,
  token: Keypair,
  provider = anchor.AnchorProvider.env()
) {
  const connection = provider.connection;
  const create_mint_tx = new Transaction({
    feePayer: creator.publicKey,
  });

  create_mint_tx.add(
    SystemProgram.createAccount({
      fromPubkey: creator.publicKey,
      newAccountPubkey: token.publicKey,
      space: MintLayout.span,
      lamports: await getMinimumBalanceForRentExemptMint(connection),
      programId: TOKEN_PROGRAM_ID,
    })
  );
  create_mint_tx.add(
    createInitializeMintInstruction(
      token.publicKey, // rewardTokenMintId pubkey
      0, // decimals
      creator.publicKey, // rewardTokenMintId authority
      creator.publicKey, // freeze authority (if you don't need it, you can set `null`)
      TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
    )
  );
  const create_mint_tx_sig = await provider.sendAndConfirm(create_mint_tx, [
    creator,
    token,
  ]);
  // console.log("create rewardTokenMintId tx", create_mint_tx_sig);
}

export async function transferToken(
  from: Keypair,
  to: PublicKey,
  mintId: PublicKey
) {
  const fromUser = createUser(from);
  const fromATA = await getOrCreateAssociatedTokenAccount(
    fromUser.provider.connection,
    fromUser.wallet.payer,
    mintId,
    fromUser.wallet.publicKey
  );

  // console.log("fromATA.address", fromUserATA.address.toBase58());

  const toATA = await getOrCreateAssociatedTokenAccount(
    fromUser.provider.connection,
    fromUser.wallet.payer,
    mintId,
    to
  );
  // console.log("toATA.address", toATA.address.toBase58());

  const transfer_token_tx = await transfer(
    fromUser.provider.connection,
    fromUser.wallet.payer,
    fromATA.address,
    toATA.address,
    fromUser.wallet.publicKey,
    1
  );
  // console.log("transfer NFT to userId tx", transfer_token_tx);
}
