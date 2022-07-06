interface INFT {
  pubkey?: PublicKey;
  mint: PublicKey;
  state: string;
  onchainMetadata: unknown; // typeof MetadataData;
  externalMetadata: MetadataJson;
}

type Cluster = "Localhost" | "Testnet" | "Devnet" | "Mainnet-beta";

type Network = {
  endpoint: string;
  name: Cluster;
};

type CallbackOptions = {
  onStart?: () => void;
  onSuccess?: () => void;
  onFinish?: () => void;
};
