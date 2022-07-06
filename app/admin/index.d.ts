interface INFT {
  pubkey?: PublicKey;
  mint: PublicKey;
  state: string;
  onchainMetadata: unknown; // typeof MetadataData;
  externalMetadata: MetadataJson;
}

enum Cluster {
  LOCALHOST = "Localhost",
  TESTNET = "Testnet",
  DEVNET = "Devnet",
  MAINNET = "Mainnet-beta",
}

type Network = {
  endpoint: string;
  name: Cluster;
};

type CallbackOptions = {
  onStart?: () => void;
  onSuccess?: () => void;
  onFinish?: () => void;
};
