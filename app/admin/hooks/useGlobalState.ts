import create from "zustand";
import * as anchor from "@project-serum/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import toast from "react-hot-toast";
import { findUserStatePDA, IDL, NcStaking, PROGRAM_ID } from "../sdk";

type Network = {
  endpoint: string;
  name: string;
};

interface GlobalState {
  connection: Connection;
  wallet: null | AnchorWallet;
  setWallet: (wallet: AnchorWallet) => void;
  network: Network;
  setNetwork: (network: Network) => void;
  users: any[];
  isFetchingUsers: boolean;
  fetchUsers: () => void;
  initiateStaking: () => void;
  configs: any[];
  isFetchingConfigs: boolean;
  fetchConfigs: () => void;
  config: number;
  setConfig: (index: number) => void;
}

const useGlobalState = create<GlobalState>((set, get) => ({
  connection: new Connection("http://localhost:8899"),
  wallet: null,
  setWallet: (wallet: AnchorWallet) => {
    set({ wallet });
  },
  network: {
    name: "Localhost",
    endpoint: "http://localhost:8899",
  },
  setNetwork: (network: Network) => {
    set({ network });
  },
  users: [],
  isFetchingUsers: false,
  fetchUsers: async () => {
    set({ isFetchingUsers: true });
    const connection = get().connection;
    const wallet = get().wallet;
    if (!wallet) {
      toast.error("Wallet Not Connected");
      return set({ users: [], isFetchingUsers: false });
    }

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      anchor.AnchorProvider.defaultOptions()
    );
    const program = new anchor.Program<NcStaking>(IDL, PROGRAM_ID, provider);
    const users = await program.account.user.all();
    set({ users, isFetchingUsers: false });
  },
  initiateStaking: async () => {
    const connection = get().connection;
    const wallet = get().wallet;
    const configs = get().configs;
    const config = get().config;
    const configId = new PublicKey(configs[config].publicKey);

    if (!wallet) {
      toast.error("Wallet Not Connected");
      return set({ users: [], isFetchingUsers: false });
    }

    const [userState] = await findUserStatePDA(wallet.publicKey, configId);

    const accounts = {
      userState,
      config: configId,
      user: wallet.publicKey,
    };
    console.log("user", accounts.user.toBase58());
    console.log("userState", accounts.userState.toBase58());
    console.log("config", accounts.config.toBase58());

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      anchor.AnchorProvider.defaultOptions()
    );
    const program = new anchor.Program<NcStaking>(IDL, PROGRAM_ID, provider);
    try {
      const tx = await program.methods.initStaking().accounts(accounts).rpc();
      console.log("init staking sig", tx);
    } catch (error) {
      console.error(error);
      toast.error("Transaction Error");
    }
    set({});
  },
  configs: [],
  isFetchingConfigs: false,
  fetchConfigs: async () => {
    set({ isFetchingConfigs: true });
    const connection = get().connection;
    const wallet = get().wallet;
    if (!wallet) {
      toast.error("Wallet Not Connected");
      return set({ users: [], isFetchingConfigs: false });
    }

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      anchor.AnchorProvider.defaultOptions()
    );
    const program = new anchor.Program<NcStaking>(IDL, PROGRAM_ID, provider);
    const configs = await program.account.stakingConfig.all();
    set({ configs, isFetchingConfigs: false });
  },
  config: 0,
  setConfig: async (index) => {
    set({ config: index });
  },
}));

export default useGlobalState;
