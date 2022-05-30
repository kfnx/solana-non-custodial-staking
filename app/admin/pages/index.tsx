import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import NetworkSelector from "../components/NetworkSelector";
import Tabs from "../components/Tabs";

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>NC-staking Admin</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen p-4 flex flex-col items-center dark:bg-stone-800 dark:text-gray-200">
        <Image
          src="https://c.tenor.com/vYc_EzLX6-cAAAAC/meeko-meekolony.gif"
          width={196}
          height={109}
          alt="meeko stake"
        />
        <div className="flex space-x-4 mt-8 mb-4">
          <NetworkSelector />
          <WalletMultiButton className="bg-blue-900/20 text-slate-600 dark:text-gray-200 shadow hover:text-white" />
        </div>
        <Tabs />
      </main>
    </div>
  );
};

export default Home;
