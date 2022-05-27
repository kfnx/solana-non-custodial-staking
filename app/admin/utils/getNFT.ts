import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import axios from "axios";
import { MetadataJson, programs } from "@metaplex/js";

const {
  metadata: { Metadata },
} = programs;

async function getTokensByOwner(owner: PublicKey, conn: Connection) {
  const tokens = await conn.getParsedTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });

  // initial filter - only available NFT (decimals == 0 && amount == 1)
  return tokens.value
    .filter((t) => {
      const amount = t.account.data.parsed.info.tokenAmount;
      return amount.decimals === 0 && amount.uiAmount === 1;
    })
    .map((t) => {
      return { pubkey: t.pubkey, mint: t.account.data.parsed.info.mint };
    });
}

interface MetadataCreators {
  address: string;
  share: number;
  verified: 0 | 1;
}

// const WHITELISTED_CREATOR_ADDRESS = CANDY_MACHINE_ID.toString();

async function getNFTMetadata(
  mint: string,
  conn: Connection,
  pubkey?: string,
  filterByCreatorAddress?: string
): Promise<INFT | undefined> {
  try {
    const metadataPDA = await Metadata.getPDA(mint);
    const onchainMetadata = (await Metadata.load(conn, metadataPDA)).data;
    const creators = onchainMetadata.data.creators || [];

    if (
      filterByCreatorAddress &&
      creators.find((c) => c.address === filterByCreatorAddress)
    ) {
      const externalMetadata = (await axios.get(onchainMetadata.data.uri)).data;
      return {
        pubkey: pubkey ? new PublicKey(pubkey) : undefined,
        mint: new PublicKey(mint),
        onchainMetadata,
        externalMetadata,
      };
    } else {
      const externalMetadata = (await axios.get(onchainMetadata.data.uri)).data;
      return {
        pubkey: pubkey ? new PublicKey(pubkey) : undefined,
        mint: new PublicKey(mint),
        onchainMetadata,
        externalMetadata,
      };
    }
  } catch (e) {
    console.warn(`failed to pull metadata for token ${mint}`);
  }
}

export async function getNFTMetadataForMany(
  tokens: any[],
  conn: Connection
): Promise<INFT[]> {
  const promises: Promise<INFT | undefined>[] = [];
  tokens.forEach((t) => promises.push(getNFTMetadata(t.mint, conn, t.pubkey)));
  const nfts = (await Promise.all(promises)).filter((n) => !!n);

  return nfts as INFT[];
}

export async function getNFTsByOwner(
  owner: PublicKey,
  conn: Connection
): Promise<INFT[]> {
  const tokens = await getTokensByOwner(owner, conn);

  return await getNFTMetadataForMany(tokens, conn);
}
