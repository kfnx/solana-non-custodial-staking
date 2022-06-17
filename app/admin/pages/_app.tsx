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
import toast, { Toaster } from "react-hot-toast";
import useGlobalStore from "../hooks/useGlobalStore";
import ErrorBoundary from "../components/ErrorBoundary";
import { WalletSignTransactionError } from "@solana/wallet-adapter-base";

// Use require instead of import since order matters
require("@solana/wallet-adapter-react-ui/styles.css");
require("../styles/globals.css");

const App: FC<AppProps> = ({ Component, pageProps }) => {
  const network = useGlobalStore((state) => state.network);
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
      <ErrorBoundary>
        <ConnectionProvider
          endpoint={network.endpoint}
          config={{
            commitment: "confirmed",
            confirmTransactionInitialTimeout: 60000,
          }}
        >
          <WalletProvider
            wallets={wallets}
            onError={(err) => {
              if (err.constructor.name === WalletSignTransactionError.name) {
                toast.error("Request rejected");
              }
            }}
          >
            <WalletModalProvider>
              <Component {...pageProps} />
              <Toaster />
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </ErrorBoundary>
    </StrictMode>
  );
};

export default App;
