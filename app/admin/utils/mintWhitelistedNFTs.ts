import * as anchor from "@project-serum/anchor";
import { NodeWallet, Wallet } from "@metaplex/js";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  MintLayout,
  TOKEN_PROGRAM_ID,
  // @ts-ignore
  getMinimumBalanceForRentExemptMint,
  // @ts-ignore
  createInitializeMintInstruction,
  // @ts-ignore
  getOrCreateAssociatedTokenAccount,
  // @ts-ignore
  createMintToInstruction,
  // @ts-ignore
  transfer,
} from "@solana/spl-token";
import useGlobalStore from "../hooks/useGlobalStore";
import { createMetadata } from "../sdk/metaplex";
import { airdropUser, findUserATA, getTokenBalanceByATA } from "../sdk/user";
import toast from "react-hot-toast";

// export function transfer(
//   connection: Connection,
//   payer: Signer,
//   source: PublicKey,
//   destination: PublicKey,
//   owner: Signer | PublicKey,
//   amount: number | bigint,
//   multiSigners?: Signer[],
//   confirmOptions?: ConfirmOptions,
//   programId?: PublicKey
// ): Promise<TransactionSignature>;

export async function transferToken(
  from: Keypair,
  to: PublicKey,
  mintId: PublicKey,
  provider: anchor.AnchorProvider
) {
  const fromATA = await findUserATA(from.publicKey, mintId);
  console.log("fromATA", fromATA.toBase58());
  // const fromATA = await getOrCreateAssociatedTokenAccount(
  //   provider.connection,
  //   from,
  //   mintId,
  //   from.publicKey
  // );

  // console.log("fromATA.address", fromUserATA.address.toBase58());
  const toATA = await findUserATA(to, mintId);
  console.log("toATA", fromATA.toBase58());
  // const toATA = await getOrCreateAssociatedTokenAccount(
  //   provider.connection,
  //   to,
  //   mintId,
  //   to
  // );
  // console.log("toATA.address", toATA.address.toBase58());

  const transfer_token_tx = await transfer(
    provider.connection,
    from,
    fromATA,
    toATA,
    from.publicKey,
    1
  );
  console.log("transfer NFT to userId tx", transfer_token_tx);
}

export async function allSynchronously<T>(
  resolvables: (() => Promise<T>)[]
): Promise<T[]> {
  const results = [];
  for (const resolvable of resolvables) {
    results.push(await resolvable());
  }
  return results;
}

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
  receiver: PublicKey,
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
  // anchor.setProvider(provider);
  const create_mint_tx = new Transaction({
    feePayer: creator.publicKey,
  });

  create_mint_tx.add(
    SystemProgram.createAccount({
      fromPubkey: creator.publicKey,
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
      creator.publicKey, // mint authority
      creator.publicKey, // freeze authority (if you don't need it, you can set `null`)
      TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
    )
  );

  const create_mint_tx_sig = await provider.sendAndConfirm(create_mint_tx, [
    creator,
    mint,
  ]);
  console.log("create mint tx", create_mint_tx_sig);

  // export function getOrCreateAssociatedTokenAccount(
  //   connection: Connection,
  //   payer: Signer,
  //   mint: PublicKey,
  //   owner: PublicKey,
  //   allowOwnerOffCurve?: boolean,
  //   commitment?: Commitment,
  //   confirmOptions?: ConfirmOptions,
  //   programId?: PublicKey,
  //   associatedTokenProgramId?: PublicKey
  // ): Promise<Account>;
  const receiverATA = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    creator,
    mint.publicKey,
    receiver
  );

  console.log("create and init receiver ATA", receiverATA);

  const mint_token_tx = new Transaction({
    feePayer: creator.publicKey,
  });

  mint_token_tx.add(
    createMintToInstruction(
      mint.publicKey, // mint
      receiverATA.address, // receiver (should be a token account)
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

  const wallet = new NodeWallet(creator);
  const metadata = await createMetadata(
    provider.connection,
    wallet,
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

const mintWhitelistedNFTs = async () => {
  try {
    const { wallet, provider } = useGlobalStore.getState();
    if (!wallet) {
      return toast.error("Wallet not connected");
    }
    console.log("mintWhitelistedNFTs ~ provider", provider);
    if (!provider) {
      return toast.error("Provider not ready");
    }

    // const selectedConfig = configs[config];
    // console.log("Creator address", NFTcreator.publicKey.toBase58());

    await airdropUser(wallet.publicKey, provider.connection);
    console.log("Minting NFT to", wallet.publicKey.toBase58());

    await allSynchronously(
      allJsonMetadata.map((meta) => async () => {
        const mint = Keypair.generate();

        console.log("creating nft");
        await createNFT(NFTcreator, wallet.publicKey, mint, meta, provider);

        // verify
        // const createdATA = await findUserATA(
        //   NFTcreator.publicKey,
        //   mint.publicKey
        // );
        // const createdATAbalance = await getTokenBalanceByATA(
        //   provider.connection,
        //   createdATA
        // );
        // console.log("verify created NFT should be 1", createdATAbalance);

        // console.log("transferring nft to you");
        // await transferToken(
        //   NFTcreator,
        //   wallet.publicKey,
        //   mint.publicKey,
        //   provider
        // );

        // verify
        const userATA = await findUserATA(wallet.publicKey, mint.publicKey);
        const userATAbalance = await getTokenBalanceByATA(
          provider.connection,
          userATA
        );
        console.log("verify your NFT should be 1", userATAbalance);
      })
    );
  } catch (error) {
    console.error(error);
  }
};

export default mintWhitelistedNFTs;
