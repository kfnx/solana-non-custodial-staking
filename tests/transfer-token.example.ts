import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import {
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  MintLayout,
  AccountLayout,
  getMinimumBalanceForRentExemptMint,
  getMinimumBalanceForRentExemptAccount,
  createInitializeMintInstruction,
  createInitializeAccountInstruction,
  createMintToInstruction,
} from "@solana/spl-token";
import { NcStaking } from "../target/types/nc_staking";
import { airdropUser, createUser, programForUser } from "./utils/user";

describe("token-cpi", () => {
  const program = anchor.workspace.NcStaking as Program<NcStaking>;
  //   const provider = anchor.AnchorProvider.env();

  const admin = createUser();
  const provider = admin.provider;
  const userProgram = programForUser(program, admin);
  const tokenAuth = Keypair.generate();
  const mint = Keypair.generate();
  const sender = Keypair.generate();
  const sender_token = Keypair.generate();
  const receiver = Keypair.generate();
  const receiver_token = Keypair.generate();

  console.log("mint", mint.publicKey.toBase58());
  console.log("sender", sender.publicKey.toBase58());
  console.log("sender_token", sender_token.publicKey.toBase58());
  console.log("receiver", receiver.publicKey.toBase58());
  console.log("receiver_token", receiver_token.publicKey.toBase58());

  it("fund users", async () => {
    await airdropUser(
      sender.publicKey,
      provider.connection,
      10 * LAMPORTS_PER_SOL
    );
    await airdropUser(
      receiver.publicKey,
      provider.connection,
      10 * LAMPORTS_PER_SOL
    );
    await airdropUser(
      admin.wallet.publicKey,
      provider.connection,
      10 * LAMPORTS_PER_SOL
    );
  });

  it("setup mints and token accounts", async () => {
    const create_mint_tx = new Transaction({
      feePayer: admin.wallet.publicKey,
    });

    // ! #1
    create_mint_tx.add(
      SystemProgram.createAccount({
        fromPubkey: admin.wallet.publicKey,
        newAccountPubkey: mint.publicKey,
        space: MintLayout.span,
        lamports: await getMinimumBalanceForRentExemptMint(provider.connection),
        programId: TOKEN_PROGRAM_ID,
      })
    );
    create_mint_tx.add(
      createInitializeMintInstruction(
        mint.publicKey, // mint pubkey
        0, // decimals
        admin.wallet.publicKey, // mint authority
        null, // freeze authority (if you don't need it, you can set `null`)
        TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
      )
    );
    const create_mint_tx_sig = await provider.sendAndConfirm(create_mint_tx, [
      admin.keypair,
      mint,
    ]);
    console.log("create_mint_tx_sig", create_mint_tx_sig);

    // ! #2
    const sender_token_tx = new Transaction({
      feePayer: sender.publicKey,
    });
    sender_token_tx.add(
      SystemProgram.createAccount({
        fromPubkey: sender.publicKey,
        newAccountPubkey: sender_token.publicKey,
        space: AccountLayout.span,
        lamports: await getMinimumBalanceForRentExemptAccount(
          provider.connection
        ),
        programId: TOKEN_PROGRAM_ID,
      })
    );

    sender_token_tx.add(
      createInitializeAccountInstruction(
        sender_token.publicKey, // token account
        mint.publicKey, // mint
        sender.publicKey, // owner of token account
        TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
      )
    );

    const sender_token_tx_sig = await provider.sendAndConfirm(sender_token_tx, [
      sender,
      sender_token,
    ]);
    console.log("sender_token_tx_sig", sender_token_tx_sig);

    // ! #3
    const receiver_token_tx = new Transaction({
      feePayer: receiver.publicKey,
    });
    receiver_token_tx.add(
      SystemProgram.createAccount({
        fromPubkey: receiver.publicKey,
        newAccountPubkey: receiver_token.publicKey,
        space: AccountLayout.span,
        lamports: await getMinimumBalanceForRentExemptAccount(
          provider.connection
        ),
        programId: TOKEN_PROGRAM_ID,
      })
    );

    receiver_token_tx.add(
      createInitializeAccountInstruction(
        receiver_token.publicKey, // token account
        mint.publicKey, // mint
        receiver.publicKey, // owner of token account
        TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
      )
    );

    const receiver_token_tx_sig = await provider.sendAndConfirm(
      receiver_token_tx,
      [receiver, receiver_token]
    );
    console.log("receiver_token_tx_sig", receiver_token_tx_sig);

    const mint_tokens_to_sender_tx = new Transaction({
      feePayer: sender.publicKey,
    });
    mint_tokens_to_sender_tx.add(
      createMintToInstruction(
        mint.publicKey, // mint
        sender_token.publicKey, // receiver (sholud be a token account)
        admin.wallet.publicKey, // mint authority
        2e6, // amount. if your decimals is 8, you mint 10^8 for 1 token.
        [], // only multisig account will use. leave it empty now.
        TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
      )
    );

    const mint_tokens_to_sender_tx_sig = await provider.sendAndConfirm(
      mint_tokens_to_sender_tx,
      [admin.keypair]
    );
    console.log("mint_tokens_to_sender_tx_sig", mint_tokens_to_sender_tx_sig);

    console.log(
      "token balance: ",
      (await provider.connection.getTokenAccountBalance(sender_token.publicKey))
        .value
    );
  });

  it("transfter wrapper", async () => {
    const amount = new anchor.BN(1e6);

    await program.methods
      .transferWrapper(amount)
      .accounts({
        sender: sender.publicKey,
        senderToken: sender_token.publicKey,
        receiverToken: receiver_token.publicKey,
        mint: mint.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([sender])
      .rpc();
    console.log(
      "sender token balance: ",
      (await provider.connection.getTokenAccountBalance(sender_token.publicKey))
        .value
    );
    console.log(
      "receiver token balance: ",
      (
        await provider.connection.getTokenAccountBalance(
          receiver_token.publicKey
        )
      ).value
    );
  });
});
