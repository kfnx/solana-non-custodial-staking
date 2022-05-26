import create from "zustand";
import * as anchor from "@project-serum/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import toast from "react-hot-toast";
import { IDL, NcStaking, PROGRAM_ID } from "../sdk";

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
  configs: any[];
  isFetchingConfigs: boolean;
  fetchConfigs: () => void;
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
    set({ users: [] });
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
}));

export default useGlobalState;
