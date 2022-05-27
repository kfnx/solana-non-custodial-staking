interface INFT {
  pubkey?: PublicKey;
  mint: PublicKey;
  state: string;
  onchainMetadata: unknown; // typeof MetadataData;
  externalMetadata: MetadataJson;
}
