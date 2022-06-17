import * as anchor from "@project-serum/anchor";
import {
  clusterApiUrl,
  Connection,
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
} from "@solana/spl-token";
import {
  getTokenBalanceByATA,
  createMetadata,
  allSynchronously,
  airdropUser,
  findUserATA,
} from "./utils";
import { transferToken } from "./utils/transaction";

const NFTcreator = Keypair.fromSecretKey(
  Uint8Array.from(
    // 6s5EfTaCCNQ855n8nTqDHue6XJ3hDaxB2ynj727AmgPt
    [
      46, 153, 255, 163, 58, 223, 86, 187, 209, 167, 46, 176, 18, 225, 156, 176,
      71, 14, 67, 109, 146, 108, 110, 61, 230, 47, 140, 147, 96, 222, 171, 222,
      87, 30, 67, 166, 139, 42, 111, 149, 250, 38, 72, 195, 127, 111, 117, 250,
      132, 207, 86, 106, 250, 33, 178, 119, 200, 158, 134, 82, 70, 103, 165, 27,
    ]
  )
);

const userId = new PublicKey("HwToSSqew673tpmGc2VqH4Q6kZJnxHmNZauTud5WoumL");
const allJsonMetadata = [
  {
    name: "Meekolony #1",
    symbol: "MKLN",
    uri: "https://arweave.net/4d1CV1GnALTT2iTyi1UiNc6AOrsL8h-sPAyVyNMlU4k",
    sellerFeeBasisPoints: 700,
    creators: [],
  },
  {
    name: "Meekolony #2",
    symbol: "MKLN",
    uri: "https://arweave.net/afxkSsnbrtCNAvbkqlCqjURUbBUSBDn_RMl1Dbq9YX8",
    sellerFeeBasisPoints: 700,
    creators: [],
  },
  {
    name: "Meekolony #3",
    symbol: "MKLN",
    uri: "https://arweave.net/I1Im-DDcnzEuLmB7Wiz1y3FknR0MwIwMVslDILHBr-g",
    sellerFeeBasisPoints: 700,
    creators: [],
  },
  {
    name: "Meekolony #4",
    symbol: "MKLN",
    uri: "https://arweave.net/RrE0HPbnv1HVVdF_DqQiFPA0YCDPli-_6zW45CBRPGc",
    sellerFeeBasisPoints: 700,
    creators: [],
  },
  {
    name: "Meekolony #5",
    symbol: "MKLN",
    uri: "https://arweave.net/WmQQC3iUXPuRvt6xsR9dI0ARbB2IJbON_NTB-y9clQw",
    sellerFeeBasisPoints: 700,
    creators: [],
  },
  {
    name: "Meekolony #6",
    symbol: "MKLN",
    uri: "https://arweave.net/1n6w6-FcZE3VO1HBNRW_T_Cvx9U3C0RVN54sFVlq3sw",
    sellerFeeBasisPoints: 700,
    creators: [],
  },
  {
    name: "Meekolony #7",
    symbol: "MKLN",
    uri: "https://arweave.net/O_4JMAd92XQ7_jo3CXJFSlR9eHMXvnVmDHhgkPk2nwc",
    sellerFeeBasisPoints: 700,
    creators: [],
  },
  {
    name: "Meekolony #8",
    symbol: "MKLN",
    uri: "https://arweave.net/2giACek19RaYiEPJcBdOgzyCYC_QHMf9i7qgnT3r8-U",
    sellerFeeBasisPoints: 700,
    creators: [],
  },
  {
    name: "Meekolony #9",
    symbol: "MKLN",
    uri: "https://arweave.net/xREW2gypD8FlI59fDJtigYSMm01YZTnSXBUTQ7vkY0",
    sellerFeeBasisPoints: 700,
    creators: [],
  },
];

const createNFT = async (
  creator: Keypair,
  mint: Keypair,
  meta: {
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: any[];
  },
  provider: anchor.AnchorProvider
) => {
  const create_mint_tx = new Transaction({
    feePayer: creator.publicKey,
  });

  create_mint_tx.add(
    SystemProgram.createAccount({
      fromPubkey: creator.publicKey,
      newAccountPubkey: mint.publicKey,
      space: MintLayout.span,
      lamports: await getMinimumBalanceForRentExemptMint(connection),
      programId: TOKEN_PROGRAM_ID,
    })
  );
  create_mint_tx.add(
    createInitializeMintInstruction(
      mint.publicKey, // mint pubkey
      0, // decimals
      creator.publicKey, // mint authority
      creator.publicKey, // freeze authority (if you don't need it, you can set `null`)
      TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
    )
  );

  const create_mint_tx_sig = await provider.sendAndConfirm(create_mint_tx, [
    creator,
    mint,
  ]);
  // console.log("create mint tx", create_mint_tx_sig);

  const NFTcreatorATA = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    creator,
    mint.publicKey,
    creator.publicKey
  );

  // console.log("create and init ATA", NFTcreatorATA.address.toBase58());

  const mint_token_tx = new Transaction({
    feePayer: creator.publicKey,
  });

  mint_token_tx.add(
    createMintToInstruction(
      mint.publicKey, // mint
      NFTcreatorATA.address, // receiver (should be a token account)
      creator.publicKey, // mint authority
      1, // amount. if your decimals is 8, you mint 10^8 for 1 token.
      [], // only multisig account will use. leave it empty now.
      TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
    )
  );

  const mint_token_tx_sig = await provider.sendAndConfirm(mint_token_tx, [
    creator,
  ]);
  console.log("mint tx", mint_token_tx_sig);

  // const ataBalance = await getTokenBalanceByATA(
  //   connection,
  //   NFTcreatorATA.address
  // );
  // console.log("mint", mint.publicKey.toBase58());
  // console.log("ATA", NFTcreatorATA.address.toBase58());
  // console.log("balance", ataBalance);

  const anchorWallet = new anchor.Wallet(creator);
  const metadata = await createMetadata(
    connection,
    anchorWallet,
    mint.publicKey,
    {
      totalCreatorsN: 5,
      ourCreatorN: 1,
      leaveUnverified: false,
      skipEntirely: false,
    },
    meta
  );

  console.log("metadata", metadata.toBase58());
  console.log(
    `🔗 https://explorer.solana.com/address/${mint.publicKey}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`
  );
  console.log(`✅ finish creating NFT`, meta.name);
};

// const programId = new PublicKey("stkMasspWTzjjNfRNb8v2QW8Hza73baxMqJ3mEi7LUW");
const connection = new Connection(clusterApiUrl("devnet"));
const anchorWallet = new anchor.Wallet(NFTcreator);
const provider = new anchor.AnchorProvider(
  connection,
  anchorWallet,
  anchor.AnchorProvider.defaultOptions()
);

(async () => {
  console.log("Creator address", NFTcreator.publicKey.toBase58());

  await airdropUser(userId);
  console.log("NFT holder address", userId.toBase58());

  await allSynchronously(
    allJsonMetadata.map((meta) => async () => {
      const mint = Keypair.generate();

      await createNFT(NFTcreator, mint, meta, provider);

      // verify
      const createdATA = await findUserATA(
        NFTcreator.publicKey,
        mint.publicKey
      );
      const createdATAbalance = await getTokenBalanceByATA(
        connection,
        createdATA
      );
      console.log(createdATAbalance, 1, "token amount 1");

      await transferToken(NFTcreator, userId, mint.publicKey);

      // verify
      const userATA = await findUserATA(userId, mint.publicKey);
      const userATAbalance = await getTokenBalanceByATA(connection, userATA);
      console.log(userATAbalance, 1, "token amount 1");
    })
  );
})();
