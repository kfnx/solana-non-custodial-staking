import * as anchor from "@project-serum/anchor";
import {
  getMinimumBalanceForRentExemptMint,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  transfer,
  createInitializeMintInstruction,
  MintLayout,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { createUser } from "./user";

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
