import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import Tabs from "../components/Tabs";
import NetworkList from "../components/NetworkList";

const Home: NextPage = () => {
  return (
    <div className="p-4">
      <Head>
        <title>NC-staking Admin</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className="text-3xl font-bold">Welcome to Non Custodial staking!</h1>
        <div className="flex space-x-4 mt-8">
          <NetworkList />
          <WalletMultiButton />
        </div>
        <Tabs />
      </main>
    </div>
  );
};

export default Home;
