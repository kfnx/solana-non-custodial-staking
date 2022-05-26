import { FC, useMemo, StrictMode } from "react";
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
  // SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { Toaster } from "react-hot-toast";
import useGlobalState from "../hooks/useGlobalState";

// Use require instead of import since order matters
require("../styles/globals.css");
require("@solana/wallet-adapter-react-ui/styles.css");

const App: FC<AppProps> = ({ Component, pageProps }) => {
  const network = useGlobalState((state) => state.network);
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
    <StrictMode>
      <ConnectionProvider
        endpoint={network.endpoint}
        config={{ commitment: "confirmed" }}
      >
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Component {...pageProps} />
            <Toaster />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </StrictMode>
  );
};

export default App;
