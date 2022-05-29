import * as anchor from "@project-serum/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  getMinimumBalanceForRentExemptMint,
  MintLayout,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getOrCreateAssociatedTokenAccount,
  createMintToInstruction,
  transfer,
} from "@solana/spl-token";
import { getTokenBalanceByATA, createMetadata, createUser } from "./utils";

/**
 * this file used for testing, create some NFT with NFTcreator address as creator in metadata and send the NFT to a user address when needed
 * to make this work change Anchor.toml test = with this file and run anchor test
 * the command to run for me is `anchor test --provider.wallet $SOLANA_CONFIG_PATH/id.json --skip-deploy --skip-local-validator --skip-build --skip-lint`
 * because i want to run this on top of a running local solana node
 */
const NFTcreator = createUser(
  anchor.AnchorProvider.env().connection,
  Keypair.fromSecretKey(
    Uint8Array.from([
      // insert Uint8Array privateKey here
    ])
  )
);

const user = new PublicKey("HwToSSqew673tpmGc2VqH4Q6kZJnxHmNZauTud5WoumL");

(async () => {
  const mint = Keypair.generate();
  //   await airdropUser(NFTcreator.wallet.publicKey);
  const create_mint_tx = new Transaction({
    feePayer: NFTcreator.wallet.publicKey,
  });

  create_mint_tx.add(
    SystemProgram.createAccount({
      fromPubkey: NFTcreator.wallet.publicKey,
      newAccountPubkey: mint.publicKey,
      space: MintLayout.span,
      lamports: await getMinimumBalanceForRentExemptMint(
        NFTcreator.provider.connection
      ),
      programId: TOKEN_PROGRAM_ID,
    })
  );
  create_mint_tx.add(
    createInitializeMintInstruction(
      mint.publicKey, // mint pubkey
      0, // decimals
      NFTcreator.wallet.publicKey, // mint authority
      NFTcreator.wallet.publicKey, // freeze authority (if you don't need it, you can set `null`)
      TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
    )
  );

  const create_mint_tx_sig = await NFTcreator.provider.sendAndConfirm(
    create_mint_tx,
    [NFTcreator.keypair, mint]
  );
  console.log("create mint tx", create_mint_tx_sig);

  const NFTcreatorATA = await getOrCreateAssociatedTokenAccount(
    NFTcreator.provider.connection,
    NFTcreator.wallet.payer,
    mint.publicKey,
    NFTcreator.wallet.publicKey
  );

  console.log("create and init ATA", NFTcreatorATA.address.toBase58());

  const mint_token_tx = new Transaction({
    feePayer: NFTcreator.wallet.publicKey,
  });

  mint_token_tx.add(
    createMintToInstruction(
      mint.publicKey, // mint
      NFTcreatorATA.address, // receiver (should be a token account)
      NFTcreator.wallet.publicKey, // mint authority
      1, // amount. if your decimals is 8, you mint 10^8 for 1 token.
      [], // only multisig account will use. leave it empty now.
      TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
    )
  );

  const mint_token_tx_sig = await NFTcreator.provider.sendAndConfirm(
    mint_token_tx,
    [NFTcreator.keypair]
  );
  console.log("mint some tokens to reward pot tx", mint_token_tx_sig);

  const ataBalance = await getTokenBalanceByATA(
    NFTcreator.provider.connection,
    NFTcreatorATA.address
  );
  console.log("mint", mint.publicKey.toBase58());
  console.log("ATA", NFTcreatorATA.address.toBase58());
  console.log("balance", ataBalance);

  const metadataJson = {
    name: "Meekolony SUEPRTESt #2323",
    symbol: "MKLN",
    uri: "https://arweave.net/1n6w6-FcZE3VO1HBNRW_T_Cvx9U3C0RVN54sFVlq3sw",
    sellerFeeBasisPoints: 700,
    creators: [],
  };

  const metadata = await createMetadata(
    NFTcreator.provider.connection,
    NFTcreator.wallet,
    mint.publicKey,
    {
      totalCreatorsN: 5,
      ourCreatorN: 1,
      leaveUnverified: false,
      skipEntirely: false,
    },
    metadataJson
  );

  console.log("metadata", metadata.toBase58());
  console.log(
    `https://explorer.solana.com/address/${mint.publicKey}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`
  );

  // transfer to an address if needed
  //   const fromATA = await getOrCreateAssociatedTokenAccount(
  //     NFTcreator.provider.connection,
  //     NFTcreator.wallet.payer,
  //     mint.publicKey,
  //     NFTcreator.wallet.publicKey
  //   );

  //   console.log("fromATA.address", NFTcreatorATA.address.toBase58());

  //   const toATA = await getOrCreateAssociatedTokenAccount(
  //     NFTcreator.provider.connection,
  //     NFTcreator.wallet.payer,
  //     mint.publicKey,
  //     user
  //   );
  //   console.log("toATA.address", toATA.address.toBase58());

  //   const transfer_token_tx = await transfer(
  //     NFTcreator.provider.connection,
  //     NFTcreator.wallet.payer,
  //     fromATA.address,
  //     toATA.address,
  //     NFTcreator.wallet.publicKey,
  //     1
  //   );
  //   console.log("transfer NFT to user tx", transfer_token_tx);
})();
