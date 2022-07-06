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
    // cretSiBGE5V7BJXnLsE84GBX5X8jxuSnbBfhAVpwGqU
    [
      238, 138, 236, 130, 250, 209, 147, 210, 134, 105, 215, 196, 0, 151, 177,
      169, 208, 115, 238, 204, 146, 68, 167, 6, 83, 64, 72, 10, 83, 13, 67, 39,
      9, 47, 120, 173, 108, 96, 173, 245, 129, 154, 169, 179, 168, 238, 210,
      173, 38, 63, 95, 127, 158, 26, 20, 158, 8, 13, 53, 56, 2, 88, 126, 55,
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

const mintWhitelistedNFTs = async () => {
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
      await createNFT(NFTcreator, wallet.publicKey, meta, provider);
    })
  );
};

export default mintWhitelistedNFTs;
