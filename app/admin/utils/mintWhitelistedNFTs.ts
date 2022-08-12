import * as anchor from "@project-serum/anchor";
import { NodeWallet } from "@metaplex/js";
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
} from "@solana/spl-token";
import useGlobalStore from "../hooks/useGlobalStore";
import { createMetadata } from "../sdk/metaplex";
import { airdropUser } from "../sdk/user";
import toast from "react-hot-toast";

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
    // crezn94Dr12A1FdEn9heFMq7fv5MAEjtFRtTBBBGqP9.json
    [
      117, 249, 235, 60, 101, 74, 235, 198, 251, 134, 91, 142, 94, 77, 70, 73,
      138, 70, 133, 78, 161, 179, 127, 112, 114, 112, 221, 94, 219, 202, 81, 8,
      9, 47, 121, 56, 248, 53, 253, 239, 77, 212, 36, 197, 43, 117, 80, 51, 93,
      45, 46, 218, 59, 57, 127, 107, 119, 90, 145, 158, 182, 4, 65, 124,
    ]
  )
);

type Metadata = {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: any[];
};

const allJsonMetadata: Metadata[] = [
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
    uri: "https://arweave.net/xREW2gypD8FlI59fDJtigYSMm01YZTnSXBUTQ7vkY0c",
    sellerFeeBasisPoints: 700,
    creators: [],
  },
];

const createNFT = async (
  creator: Keypair,
  receiver: PublicKey,
  meta: Metadata,
  provider: anchor.AnchorProvider
) => {
  const mint = Keypair.generate();
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

const mintWhitelistedNFTs = async (amount: number) => {
  let nftToMint = [];
  for (let index = 0; index < amount; index++) {
    nftToMint.push(allJsonMetadata[index]);
  }
  const { wallet, provider } = useGlobalStore.getState();
  if (!wallet) {
    return toast.error("Wallet not connected");
  }
  console.log("mintWhitelistedNFTs ~ provider", provider);
  if (!provider) {
    return toast.error("Provider not ready");
  }

  await airdropUser(wallet.publicKey, provider.connection);
  console.log("Minting NFT to", wallet.publicKey.toBase58());

  await allSynchronously(
    nftToMint.map((meta) => async () => {
      await createNFT(NFTcreator, wallet.publicKey, meta, provider);
    })
  );
};

export default mintWhitelistedNFTs;
