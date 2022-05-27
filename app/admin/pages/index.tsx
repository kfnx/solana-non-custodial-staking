import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import Tabs from "../components/Tabs";
import NetworkSelector from "../components/NetworkSelector";
import { useEffect } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import useGlobalState from "../hooks/useGlobalState";
import Image from "next/image";

const Home: NextPage = () => {
  const wallet = useAnchorWallet();
  const setWallet = useGlobalState((state) => state.setWallet);

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

      <main className={styles.main}>
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
