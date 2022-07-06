import create from "zustand";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import toast from "react-hot-toast";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  // @ts-ignore
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  findConfigAuthorityPDA,
  findDelegateAuthPDA,
  findEditionPDA,
  findMetadataPDA,
  findRewardPotPDA,
  findStakeInfoPDA,
  findUserStatePDA,
} from "../sdk/pda";
import { STAKING_REWARD_ID, TOKEN_METADATA_PROGRAM_ID } from "../sdk/address";
import { IDL, NcStaking } from "../sdk/nc_staking";
import { findUserATA, getTokenBalanceByATA } from "../sdk/user";
import { PROGRAM_ID } from "../sdk";

export const networks: Network[] = [
  { name: Cluster.LOCALHOST, endpoint: "http://localhost:8899" },
  { name: Cluster.TESTNET, endpoint: "https://api.testnet.solana.com" },
  { name: Cluster.DEVNET, endpoint: "https://api.devnet.solana.com" },
  { name: Cluster.MAINNET, endpoint: "https://api.mainnet-beta.solana.com" },
  // { name: "Mainnet-beta (private node)", endpoint: "http://localhost:8899" },
];

async function checkUserInitiated(
  userStatePDA: PublicKey,
  program: Program<NcStaking>
) {
  try {
    // will throw error if not found
    await program.account.user.fetch(userStatePDA);
    return true;
  } catch (error) {
    return false;
  }
}

interface GlobalState {
  // setters
  connection: Connection;
  setConnection: (connection: Connection) => void;
  wallet: undefined | AnchorWallet;
  setWallet: (wallet: AnchorWallet) => void;
  provider: undefined | AnchorProvider;
  setProvider: (provider: AnchorProvider) => void;
  network: Network;
  setNetwork: (network: Network) => void;
  myNFT: INFT[];
  fetchMyNFT: () => void;
  config: number;
  setConfig: (index: number) => void;
  selectedNFT: undefined | PublicKey;
  selectNFT: (mint: PublicKey | undefined) => void;
  userInitiated: boolean;
  setUserState: (isInit: Boolean) => void;
  checkUserInitiated: () => void;

  // program account fetch
  users: any[];
  fetchUsersLoading: boolean;
  fetchUsersSuccess: boolean;
  fetchUsers: () => void;
  configs: any[];
  fetchConfigsLoading: boolean;
  fetchConfigsSuccess: boolean;
  fetchConfigs: () => void;
  stakeInfo: any[];
  fetchStakeInfoLoading: boolean;
  fetchStakeInfoSuccess: boolean;
  fetchStakeInfo: () => void;
  userTokenBalance: undefined | number;
  fetchUserTokenBalance: () => void;

  // instruction dispatch
  initiateStaking: (cbOptions: CallbackOptions) => void;
  stake: (cbOptions: CallbackOptions) => void;
  unstake: (cbOptions: CallbackOptions) => void;
  claim: (cbOptions: CallbackOptions) => void;
}

const initialNetwork = networks[2];

const useGlobalStore = create<GlobalState>((set, get) => ({
  connection: new Connection(initialNetwork.endpoint, {
    commitment: "confirmed",
  }),
  setConnection: (connection: Connection) => {
    set({ connection });
  },
  wallet: undefined,
  setWallet: (wallet: AnchorWallet) => {
    set({ wallet });
  },
  provider: undefined,
  setProvider: (provider: AnchorProvider) => set({ provider }),
  network: initialNetwork,
  setNetwork: (network: Network) => {
    const wallet = get().wallet;
    if (!wallet) {
      return toast.error("Wallet Not Connected");
    }
    console.log(`setNetwork`, network.name, network.endpoint);
    const connection = new Connection(network.endpoint, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 90000,
    });
    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    set({ network, provider, connection });
  },
  myNFT: [],
  fetchMyNFT: async () => {
    // const myNFT = program.fetch
    set({ myNFT: [] });
  },
  config: 0,
  setConfig: (index) => {
    set({ config: index });
  },
  selectedNFT: undefined,
  selectNFT: (selectedNFT) => {
    set({ selectedNFT });
  },
  userInitiated: false,
  setUserState: (userInitiated) => {
    set({ userInitiated: Boolean(userInitiated) });
  },
  checkUserInitiated: async () => {
    const wallet = get().wallet;
    if (!wallet) {
      toast.error("Wallet Not Connected");
      return set({
        userInitiated: false,
      });
    }
    const connection = get().connection;
    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    const program = new Program<NcStaking>(IDL, PROGRAM_ID, provider);

    const { configs, config } = get();
    if (!configs[config]) {
      toast.error("Select a staking config");
      return;
    }
    const configId = configs[config].publicKey;
    const [userStatePDA] = await findUserStatePDA(wallet.publicKey, configId);

    const isUserInitiated = await checkUserInitiated(userStatePDA, program);
    set({ userInitiated: isUserInitiated });
  },

  // program accounts fetchs
  users: [],
  fetchUsersLoading: false,
  fetchUsersSuccess: false,
  fetchUsers: async () => {
    set({
      fetchUsersLoading: true,
      fetchUsersSuccess: false,
    });
    const wallet = get().wallet;
    if (!wallet) {
      toast.error("Wallet Not Connected");
      return set({
        users: [],
        fetchUsersLoading: false,
        fetchUsersSuccess: false,
      });
    }

    toast("Fetching user PDAs..");
    const connection = get().connection;
    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    const program = new Program<NcStaking>(IDL, PROGRAM_ID, provider);
    const users = await program.account.user.all();

    set({
      users,
      fetchUsersLoading: false,
      fetchUsersSuccess: true,
    });
  },
  configs: [],
  fetchConfigsLoading: false,
  fetchConfigsSuccess: false,
  fetchConfigs: async () => {
    set({
      fetchConfigsLoading: true,
      fetchConfigsSuccess: false,
    });
    const connection = get().connection;
    const wallet = get().wallet;
    if (!wallet) {
      toast.error("Wallet Not Connected");
      return set({
        fetchConfigsLoading: false,
        fetchConfigsSuccess: false,
      });
    }

    toast("Fetching staking config PDAs..");
    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    const program = new Program<NcStaking>(IDL, PROGRAM_ID, provider);
    console.log("PROGRAM_ID", PROGRAM_ID.toBase58());
    try {
      const configs = await program.account.stakingConfig.all();
      set({
        provider,
        configs,
        fetchConfigsLoading: false,
        fetchConfigsSuccess: true,
      });
    } catch (error) {
      console.error(error);
      toast.error("Request failed");
      set({
        fetchConfigsLoading: false,
        fetchConfigsSuccess: false,
      });
    }
  },
  stakeInfo: [],
  fetchStakeInfoLoading: false,
  fetchStakeInfoSuccess: false,
  fetchStakeInfo: async () => {
    set({
      fetchStakeInfoLoading: true,
      fetchStakeInfoSuccess: false,
    });
    const connection = get().connection;
    const wallet = get().wallet;
    if (!wallet) {
      toast.error("Wallet Not Connected");
      return set({
        fetchStakeInfoLoading: false,
        fetchStakeInfoSuccess: false,
      });
    }

    toast("Fetching stake info PDAs..");
    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    const program = new Program<NcStaking>(IDL, PROGRAM_ID, provider);
    console.log("PROGRAM_ID", PROGRAM_ID.toBase58());
    try {
      const stakeInfo = await program.account.stakeInfo.all();
      console.log("🚀 fetchStakeInfo: ~ stakeInfo", stakeInfo)
      set({
        provider,
        stakeInfo,
        fetchStakeInfoLoading: false,
        fetchStakeInfoSuccess: true,
      });
    } catch (error) {
      console.error(error);
      toast.error("Request failed");
      set({
        fetchStakeInfoLoading: false,
        fetchStakeInfoSuccess: false,
      });
    }
  },
  userTokenBalance: 0,
  fetchUserTokenBalance: async () => {
    const wallet = get().wallet;
    if (!wallet) {
      toast.error("Wallet Not Connected");
      return;
    }

    const userATA = await findUserATA(wallet.publicKey, STAKING_REWARD_ID);
    const connection = get().connection;
    const userTokenBalance = await getTokenBalanceByATA(connection, userATA);

    return set({
      userTokenBalance,
    });
  },

  // instruction dispatcher
  initiateStaking: async (callbackOptions) => {
    if (callbackOptions.onStart) {
      callbackOptions.onStart();
    }
    const ixName = "Init staking";
    const { connection, wallet, configs, config } = get();
    if (!wallet) {
      toast.error("Wallet Not Connected");
      return;
    }

    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    const program = new Program<NcStaking>(IDL, PROGRAM_ID, provider);

    if (!configs[config]) {
      toast.error("Select a staking config");
      if (callbackOptions.onFinish) {
        callbackOptions.onFinish();
      }
      return;
    }
    const configId = configs[config].publicKey;
    const [userState] = await findUserStatePDA(wallet.publicKey, configId);

    const accounts = {
      userState,
      config: configId,
      user: wallet.publicKey,
    };
    console.log("user", accounts.user.toBase58());
    console.log("userState", accounts.userState.toBase58());
    console.log("config", accounts.config.toBase58());

    const acc = await connection.getAccountInfoAndContext(accounts.userState);
    if (acc.value) {
      toast.error("Account already initated in current config");
      if (callbackOptions.onFinish) {
        callbackOptions.onFinish();
      }
      return;
    }

    const initStakingTx = program.methods
      .initStaking()
      .accounts(accounts)
      .rpc();

    toast
      .promise(initStakingTx, {
        loading: `Processing ${ixName} tx...`,
        success: `${ixName} success!`,
        error: `${ixName} failed`,
      })
      .then((val) => {
        console.log(`${ixName} sig`, val);
        set({ userInitiated: true });
        if (callbackOptions.onSuccess) {
          callbackOptions.onSuccess();
        }
      })
      .catch((err) => {
        console.error(err);
        if (
          err.message ===
          "failed to send transaction: Transaction simulation failed: Attempt to debit an account but found no record of a prior credit."
        ) {
          toast.error("Your solana balance is empty");
        } else {
          toast.error("Transaction Error");
        }
      })
      .finally(() => {
        if (callbackOptions.onFinish) {
          callbackOptions.onFinish();
        }
      });
  },
  stake: async (callbackOptions) => {
    if (callbackOptions.onStart) {
      callbackOptions.onStart();
    }
    const ixName = "Stake";
    const { connection, wallet, configs, config, selectedNFT } = get();
    if (!wallet) {
      toast.error("Wallet Not Connected");
      if (callbackOptions.onFinish) {
        callbackOptions.onFinish();
      }
      return;
    }
    if (!selectedNFT) {
      toast.error("NFT not selected");
      if (callbackOptions.onFinish) {
        callbackOptions.onFinish();
      }
      return;
    }

    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    const program = new Program<NcStaking>(IDL, PROGRAM_ID, provider);

    if (!configs[config]) {
      toast.error("Select a staking config");
      if (callbackOptions.onFinish) {
        callbackOptions.onFinish();
      }
      return;
    }
    const configId = new PublicKey(configs[config].publicKey);

    const tokenAccount = await findUserATA(wallet.publicKey, selectedNFT);
    // console.log("user ATA", tokenAccount.toBase58());
    const [delegate] = await findDelegateAuthPDA(tokenAccount);
    // console.log("user delegate", delegate.toBase58());
    const [edition] = await findEditionPDA(selectedNFT);
    // console.log("edition", edition.toBase58());
    const [userState] = await findUserStatePDA(wallet.publicKey, configId);
    // console.log("user state", userState.toBase58());
    const [stakeInfo] = await findStakeInfoPDA(wallet.publicKey, selectedNFT);
    const metadata = await findMetadataPDA(selectedNFT);

    const stakeNFTtx = program.methods
      .stake()
      .accounts({
        user: wallet.publicKey,
        stakeInfo,
        config: configId,
        mint: selectedNFT,
        tokenAccount,
        userState,
        delegate,
        edition,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .remainingAccounts([
        {
          pubkey: metadata,
          isWritable: false,
          isSigner: false,
        },
      ])
      .rpc();

    toast
      .promise(stakeNFTtx, {
        loading: `Processing ${ixName} tx...`,
        success: `${ixName} success!`,
        error: `${ixName} failed`,
      })
      .then((val) => {
        console.log(`${ixName} sig`, val);
        if (callbackOptions.onSuccess) {
          callbackOptions.onSuccess();
        }
      })
      .catch((err) => {
        if (
          err.message ===
          "failed to send transaction: Transaction simulation failed: Attempt to debit an account but found no record of a prior credit."
        ) {
          toast.error("Your solana balance is empty");
        } else if (err?.error?.errorMessage) {
          toast.error(err.error.errorMessage);
        } else {
          toast.error("Transaction Error");
        }
      })
      .finally(() => {
        set({ selectedNFT: undefined });
        if (callbackOptions.onFinish) {
          callbackOptions.onFinish();
        }
      });
  },
  unstake: async (callbackOptions) => {
    if (callbackOptions.onStart) {
      callbackOptions.onStart();
    }
    const ixName = "Unstake";
    const { connection, wallet, configs, config, selectedNFT } = get();
    if (!wallet) {
      toast.error("Wallet Not Connected");
      if (callbackOptions.onFinish) {
        callbackOptions.onFinish();
      }
      return;
    }
    if (!selectedNFT) {
      toast.error("NFT not selected");
      if (callbackOptions.onFinish) {
        callbackOptions.onFinish();
      }
      return;
    }

    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    const program = new Program<NcStaking>(IDL, PROGRAM_ID, provider);

    if (!configs[config]) {
      toast.error("Select a staking config");
      if (callbackOptions.onFinish) {
        callbackOptions.onFinish();
      }
      return;
    }
    const configId = new PublicKey(configs[config].publicKey);

    const tokenAccount = await findUserATA(wallet.publicKey, selectedNFT);
    // console.log("user ATA", tokenAccount.toBase58());
    const [delegate] = await findDelegateAuthPDA(tokenAccount);
    // console.log("user delegate", delegate.toBase58());
    const [edition] = await findEditionPDA(selectedNFT);
    // console.log("edition", edition.toBase58());
    const [userState] = await findUserStatePDA(wallet.publicKey, configId);
    // console.log("user state", userState.toBase58());
    const [stakeInfo] = await findStakeInfoPDA(wallet.publicKey, selectedNFT);

    const stakeNFTtx = program.methods
      .unstake()
      .accounts({
        user: wallet.publicKey,
        stakeInfo,
        config: configId,
        mint: selectedNFT,
        tokenAccount,
        userState,
        delegate,
        edition,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .rpc();

    toast
      .promise(stakeNFTtx, {
        loading: `Processing ${ixName} tx...`,
        success: `${ixName} success!`,
        error: `${ixName} failed`,
      })
      .then((val) => {
        console.log(`${ixName} sig`, val);
        if (callbackOptions.onSuccess) {
          callbackOptions.onSuccess();
        }
      })
      .catch((err) => {
        console.error(err);
        if (
          err.message ===
          "failed to send transaction: Transaction simulation failed: Attempt to debit an account but found no record of a prior credit."
        ) {
          toast.error("Your solana balance is empty");
        } else if (err?.error?.errorMessage) {
          toast.error(err.error.errorMessage);
        } else {
          toast.error("Transaction Error");
        }
      })
      .finally(() => {
        set({ selectedNFT: undefined });
        if (callbackOptions.onFinish) {
          callbackOptions.onFinish();
        }
      });
  },
  claim: async (callbackOptions) => {
    if (callbackOptions.onStart) {
      callbackOptions.onStart();
    }
    const ixName = "Claim";
    const { connection, wallet, configs, config } = get();
    if (!wallet) {
      toast.error("Wallet Not Connected");
      if (callbackOptions.onFinish) {
        callbackOptions.onFinish();
      }
      return;
    }

    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    const program = new Program<NcStaking>(IDL, PROGRAM_ID, provider);

    if (!configs[config]) {
      toast.error("Select a staking config");
      if (callbackOptions.onFinish) {
        callbackOptions.onFinish();
      }
      return;
    }
    const configId = new PublicKey(configs[config].publicKey);
    const rewardMint = configs[config].account.rewardMint;

    const [configAuth, configAuthBump] = await findConfigAuthorityPDA(configId);
    // console.log("configAuth", configAuth.toBase58());

    const [rewardPot, rewardPotBump] = await findRewardPotPDA(
      configId,
      rewardMint
    );
    // console.log("reward pot", rewardPot.toBase58());

    // const userATA = await findUserATA(wallet.publicKey, rewardMint);
    const userATA = await getAssociatedTokenAddress(
      rewardMint,
      wallet.publicKey
    );
    // const userATA = await getOrCreateAssociatedTokenAccount(
    //   connection,
    //   wallet,
    //   rewardMint,
    //   wallet.publicKey
    // );
    console.log("userATA", userATA.toBase58());

    const [userState] = await findUserStatePDA(wallet.publicKey, configId);

    const claimTx = program.methods
      .claim(configAuthBump, rewardPotBump)
      .accounts({
        user: wallet.publicKey,
        userState,
        config: configId,
        configAuthority: configAuth,
        rewardDestination: userATA,
        rewardMint,
        rewardPot,

        // programs
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    toast
      .promise(claimTx, {
        loading: `Processing ${ixName} tx...`,
        success: `${ixName} success!`,
        error: `${ixName} failed`,
      })
      .then((val) => {
        console.log(`${ixName} sig`, val);
        if (callbackOptions.onSuccess) {
          callbackOptions.onSuccess();
        }
      })
      .catch((err) => {
        console.error(err);
        if (
          err.message ===
          "failed to send transaction: Transaction simulation failed: Attempt to debit an account but found no record of a prior credit."
        ) {
          toast.error("Your solana balance is empty");
        } else if (err?.error?.errorMessage) {
          toast.error(err.error.errorMessage);
        } else {
          toast.error("Transaction Error");
        }
      })
      .finally(() => {
        if (callbackOptions.onFinish) {
          callbackOptions.onFinish();
        }
      });
  },
}));

export default useGlobalStore;
