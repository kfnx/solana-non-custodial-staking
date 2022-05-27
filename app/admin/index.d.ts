interface INFT {
  pubkey?: PublicKey;
  mint: PublicKey;
  onchainMetadata: unknown; // typeof MetadataData;
  externalMetadata: MetadataJson;
}
