import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import axios from "axios";
import { programs } from "@metaplex/js";
import { NFT_CREATOR_ID } from "../sdk/address";

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
      return {
        pubkey: t.pubkey,
        mint: t.account.data.parsed.info.mint,
        state: t.account.data.parsed.info.state,
      };
    });
}

interface MetadataCreators {
  address: string;
  share: number;
  verified: 0 | 1;
}

async function getNFT(
  conn: Connection,
  tokenInfo: any,
  filterByCreatorAddress?: PublicKey
): Promise<INFT | undefined> {
  try {
    const metadataPDA = await Metadata.getPDA(tokenInfo.mint);
    const onchainMetadata = (await Metadata.load(conn, metadataPDA)).data;
    const creators = onchainMetadata.data.creators || [];
    const filter = filterByCreatorAddress
      ? creators.find((c) => c.address === NFT_CREATOR_ID.toBase58())
      : true;
    if (filter) {
      const externalMetadata = (await axios.get(onchainMetadata.data.uri)).data;
      return {
        pubkey: tokenInfo.pubkey ? new PublicKey(tokenInfo.pubkey) : undefined,
        mint: new PublicKey(tokenInfo.mint),
        state: tokenInfo.state,
        onchainMetadata,
        externalMetadata,
      };
    }
  } catch (e) {
    console.warn(`failed to pull metadata for token ${tokenInfo.mint}`);
  }
}

export async function getNFTMetadataForMany(
  tokens: any[],
  conn: Connection
): Promise<INFT[]> {
  const promises: Promise<INFT | undefined>[] = [];
  tokens.forEach((t) => promises.push(getNFT(conn, t, NFT_CREATOR_ID)));
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
