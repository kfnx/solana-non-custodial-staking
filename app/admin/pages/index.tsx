import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { NextPage } from "next";
import Head from "next/head";
import Tabs from "../components/Tabs";
import NetworkSelector from "../components/NetworkSelector";
import { useEffect } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import useGlobalStore from "../hooks/useGlobalStore";
import Image from "next/image";

const Home: NextPage = () => {
  const wallet = useAnchorWallet();
  const setWallet = useGlobalStore((state) => state.setWallet);

  useEffect(() => {
    if (wallet) {
      setWallet(wallet);
    }
  }, [setWallet, wallet]);

  return (
    <div className="p-4">
      <Head>
        <title>NC-staking Admin</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen p-4 flex flex-col items-center">
        <Image
          src="https://c.tenor.com/vYc_EzLX6-cAAAAC/meeko-meekolony.gif"
          width={196}
          height={109}
          alt="meeko stake"
        />
        <div className="flex space-x-4 mt-8 mb-4">
          <NetworkSelector />
          <WalletMultiButton />
        </div>
        <Tabs />
      </main>
    </div>
  );
};

export default Home;
