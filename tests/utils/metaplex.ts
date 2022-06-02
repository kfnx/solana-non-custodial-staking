import { actions, programs, Wallet } from "@metaplex/js";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { readJSON } from "./helper";
import { delay } from "./index";

// https://github.com/gemworks/gem-farm/blob/f387d43628ae079a42301336bade2cda1cb25522/tests/metaplex.ts

type CreatorConfig = {
  // must cleanly divide 100, max 5 (metaplex's constraint)
  totalCreatorsN: number;
  // starts from 1, not 0
  ourCreatorN: number;
  // leave our creator unverified for negatives testing
  leaveUnverified: boolean;
  // skips our creator entirely for negatives testing
  skipEntirely: boolean;
};

type MetadataJson = {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: any[];
};

export async function createMetadata(
  connection: Connection,
  wallet: Wallet,
  editionMint: PublicKey,
  creatorConfig: CreatorConfig = {
    totalCreatorsN: 5,
    ourCreatorN: 1,
    leaveUnverified: false,
    skipEntirely: false,
  },
  metadataJson?: MetadataJson
) {
  const metadataData = parseMetadata(
    metadataJson || readJSON("./tests/artifacts/metadata.json")
  );

  const { totalCreatorsN, ourCreatorN, leaveUnverified, skipEntirely } =
    creatorConfig;
  // we insert as many creators as we'd like for testing, including our target creator
  for (let i = 0; i < totalCreatorsN; i++) {
    metadataData.creators!.push(
      new programs.metadata.Creator({
        address:
          !skipEntirely && i === ourCreatorN - 1
            ? wallet.publicKey.toBase58()
            : Keypair.generate().publicKey.toBase58(),
        verified: !leaveUnverified && i === ourCreatorN - 1, // all of them NOT verified, except for target creator
        share: 100 / totalCreatorsN,
      })
    );
  }

  await actions.createMetadata({
    connection,
    wallet,
    editionMint,
    metadataData,
  });

  // necessary for metadata to propagate, even on localnet
  await delay(2000);

  await actions.createMasterEdition({
    connection,
    wallet,
    editionMint,
  });

  // necessary for metadata to propagate, even on localnet
  await delay(2000);

  // verify metadata propagated successfully and is available
  const metadata = await programs.metadata.Metadata.getPDA(editionMint);
  const metadataAcc = await programs.metadata.Metadata.load(
    connection,
    metadata
  );

  return metadata;
}

function parseMetadata(jsonMetadata: any) {
  return new programs.metadata.MetadataDataData({
    name: jsonMetadata.name,
    symbol: jsonMetadata.symbol,
    uri: jsonMetadata.uri,
    sellerFeeBasisPoints: jsonMetadata.sellerFeeBasisPoints,
    creators: jsonMetadata.creators.map(
      (c: any) =>
        new programs.metadata.Creator({
          address: c.address,
          verified: c.verified,
          share: c.share,
        })
    ),
  });
}
