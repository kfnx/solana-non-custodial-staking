import { FC, useMemo } from "react";
import { AppProps } from "next/app";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  GlowWalletAdapter,
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { Toaster } from "react-hot-toast";
import { clusterApiUrl, ConnectionConfig } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useEndpoint } from "../hooks/useEndpoint";
import { EndpointProvider } from "../context/Endpoint";

// Use require instead of import since order matters
require("../styles/globals.css");
require("@solana/wallet-adapter-react-ui/styles.css");

const App: FC<AppProps> = ({ Component, pageProps }) => {
  // const network = WalletAdapterNetwork.Devnet;
  // const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  // const { endpoint } = useEndpoint();
  // console.log("endpoint", endpoint, endpointX)
  const endpoint = "http://localhost:8899";
  const wallets = useMemo(
    () => [
      new GlowWalletAdapter(),
      new LedgerWalletAdapter(),
      new PhantomWalletAdapter(),
      new SlopeWalletAdapter(),
      // new SolflareWalletAdapter({ network }),
      new SolletExtensionWalletAdapter(),
      new SolletWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  return (
    // <EndpointProvider>
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Component {...pageProps} />
          <Toaster />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
    // </EndpointProvider>
  );
};

export default App;
