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

type DispatchOptions = {
  onStart: () => void;
  onSuccess: () => void;
  onFinish: () => void;
};

interface GlobalState {
  connection: Connection;
  setConnection: (wallet: Connection) => void;
  wallet: null | AnchorWallet;
  setWallet: (wallet: AnchorWallet) => void;
  network: Network;
  setNetwork: (network: Network) => void;
  users: any[];
  isFetchingUsers: boolean;
  fetchUsers: () => void;
  myNFT: INFT[];
  fetchMyNFT: () => void;
  initiateStaking: (options: DispatchOptions) => void;
  configs: any[];
  isFetchingConfigs: boolean;
  fetchConfigs: () => void;
  config: number;
  setConfig: (index: number) => void;
}

const useGlobalState = create<GlobalState>((set, get) => ({
  connection: new Connection("http://localhost:8899", {
    commitment: "confirmed",
  }),
  setConnection: (connection: Connection) => {
    set({ connection });
  },
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
  myNFT: [],
  fetchMyNFT: async () => {
    // const myNFT = program.fetch
    set({ myNFT: [] });
  },
  initiateStaking: async (options) => {
    if (options.onStart) {
      options.onStart();
    }
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
    const initStakingTx = program.methods
      .initStaking()
      .accounts(accounts)
      .rpc();

    toast
      .promise(initStakingTx, {
        loading: "Processing transaction...",
        success: "Config created!",
        error: "Init staking failed",
      })
      .then((val) => {
        console.log("init staking sig", val);
        if (options.onSuccess) {
          options.onSuccess();
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Transaction Error");
      })
      .finally(() => {
        if (options.onFinish) {
          options.onFinish();
        }
      });
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
