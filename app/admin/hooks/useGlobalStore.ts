import create, { GetState } from "zustand";
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
  findConfigAuthorityPDA,
  findDelegateAuthPDA,
  findEditionPDA,
  findMetadataPDA,
  findRewardPotPDA,
  findStakeInfoPDA,
  findUserATA,
  findUserStatePDA,
  IDL,
  NcStaking,
  PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID,
} from "../sdk";
import { WalletError } from "@solana/wallet-adapter-base";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  // @ts-ignore
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

type Network = {
  endpoint: string;
  name: string;
};

type CallbackOptions = {
  onStart?: () => void;
  onSuccess?: () => void;
  onFinish?: () => void;
};

// TODO: complete abstraction, if needed.
// const AnchorProgramBuilder = (
//   get: GetState<GlobalState>
// ): Program<NcStaking> | WalletError => {
//   const { wallet, connection } = get();
//   if (!wallet) {
//     toast.error("Wallet Not Connected");
//     return new WalletError();
//   }

//   const provider = new AnchorProvider(
//     connection,
//     wallet,
//     AnchorProvider.defaultOptions()
//   );
//   return new Program<NcStaking>(IDL, PROGRAM_ID, provider);
// };

interface GlobalState {
  // setters
  connection: Connection;
  setConnection: (wallet: Connection) => void;
  wallet: undefined | AnchorWallet;
  setWallet: (wallet: AnchorWallet) => void;
  network: Network;
  setNetwork: (network: Network) => void;
  myNFT: INFT[];
  fetchMyNFT: () => void;
  config: number;
  setConfig: (index: number) => void;
  selectedNFT: undefined | PublicKey;
  selectNFT: (mint: PublicKey | undefined) => void;

  // program account fetch
  users: any[];
  fetchUsersRunning: boolean;
  fetchUsersLoading: boolean;
  fetchUsersSuccess: boolean;
  fetchUsers: () => void;
  configs: any[];
  fetchConfigsRunning: boolean;
  fetchConfigsLoading: boolean;
  fetchConfigsSuccess: boolean;
  fetchConfigs: () => void;
  userTokenBalance: undefined | number;
  fetchUserTokenBalance: () => void;

  // instruction dispatch
  initiateStaking: (cbOptions: CallbackOptions) => void;
  stake: (cbOptions: CallbackOptions) => void;
  unstake: (cbOptions: CallbackOptions) => void;
  claim: (cbOptions: CallbackOptions) => void;
}

const useGlobalStore = create<GlobalState>((set, get) => ({
  connection: new Connection("http://localhost:8899", {
    commitment: "confirmed",
  }),
  setConnection: (connection: Connection) => {
    set({ connection });
  },
  wallet: undefined,
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

  // program accounts fetchs
  users: [],
  fetchUsersRunning: false,
  fetchUsersLoading: false,
  fetchUsersSuccess: false,
  fetchUsers: async () => {
    set({
      fetchUsersLoading: true,
      fetchConfigsRunning: true,
      fetchUsersSuccess: false,
    });
    const connection = get().connection;
    const wallet = get().wallet;
    if (!wallet) {
      toast.error("Wallet Not Connected");
      return set({
        users: [],
        fetchUsersLoading: false,
        fetchConfigsRunning: false,
        fetchUsersSuccess: false,
      });
    }

    toast("Fetching user PDAs..");
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
      fetchConfigsRunning: false,
      fetchUsersSuccess: true,
    });
  },
  configs: [],
  fetchConfigsRunning: false,
  fetchConfigsLoading: false,
  fetchConfigsSuccess: false,
  fetchConfigs: async () => {
    set({ fetchConfigsLoading: true, fetchConfigsSuccess: false });
    const connection = get().connection;
    const wallet = get().wallet;
    if (!wallet) {
      toast.error("Wallet Not Connected");
      return set({
        users: [],
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
    const configs = await program.account.stakingConfig.all();
    set({ configs, fetchConfigsLoading: false, fetchConfigsSuccess: true });
  },
  userTokenBalance: undefined,
  fetchUserTokenBalance: async () => {},

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

    const configId = new PublicKey(configs[config].publicKey);
    const [userState] = await findUserStatePDA(wallet.publicKey, configId);

    const accounts = {
      userState,
      config: configId,
      user: wallet.publicKey,
    };
    console.log("user", accounts.user.toBase58());
    console.log("userState", accounts.userState.toBase58());
    console.log("config", accounts.config.toBase58());

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
        if (callbackOptions.onSuccess) {
          callbackOptions.onSuccess();
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Transaction Error");
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
      return;
    }
    if (!selectedNFT) {
      toast.error("NFT not selected");
      return;
    }

    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    const program = new Program<NcStaking>(IDL, PROGRAM_ID, provider);

    const configId = new PublicKey(configs[config].publicKey);

    const tokenAccount = await findUserATA(wallet.publicKey, selectedNFT);
    // console.log("user ATA", tokenAccount.toBase58());
    const [delegate] = await findDelegateAuthPDA(tokenAccount);
    // console.log("user delegate", delegate.toBase58());
    const [edition] = await findEditionPDA(selectedNFT);
    // console.log("edition", edition.toBase58());
    const [userState] = await findUserStatePDA(wallet.publicKey, configId);
    // console.log("user state", userState.toBase58());
    const [stakeInfo] = await findStakeInfoPDA(
      selectedNFT,
      wallet.publicKey,
      configId
    );
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
        console.error(err);
        toast.error("Transaction Error");
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
      return;
    }
    if (!selectedNFT) {
      toast.error("NFT not selected");
      return;
    }

    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    const program = new Program<NcStaking>(IDL, PROGRAM_ID, provider);

    const configId = new PublicKey(configs[config].publicKey);

    const tokenAccount = await findUserATA(wallet.publicKey, selectedNFT);
    // console.log("user ATA", tokenAccount.toBase58());
    const [delegate] = await findDelegateAuthPDA(tokenAccount);
    // console.log("user delegate", delegate.toBase58());
    const [edition] = await findEditionPDA(selectedNFT);
    // console.log("edition", edition.toBase58());
    const [userState] = await findUserStatePDA(wallet.publicKey, configId);
    // console.log("user state", userState.toBase58());
    const [stakeInfo] = await findStakeInfoPDA(
      selectedNFT,
      wallet.publicKey,
      configId
    );

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
        toast.error("Transaction Error");
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
      return;
    }

    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    const program = new Program<NcStaking>(IDL, PROGRAM_ID, provider);

    const configId = new PublicKey(configs[config].publicKey);
    console.log("claim: ~ config", configs[config]);
    const rewardMint = new PublicKey(configs[config].publicKey);

    const [configAuth, configAuthBump] = await findConfigAuthorityPDA(configId);
    // console.log("configAuth", configAuth.toBase58());

    const [rewardPot, rewardPotBump] = await findRewardPotPDA(
      configId,
      rewardMint
    );
    // console.log("reward pot", rewardPot.toBase58());

    // const userATA = await findUserATA(wallet.publicKey, rewardMint);
    const userATA = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      rewardMint,
      wallet.publicKey
    );
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
        toast.error("Transaction Error");
      })
      .finally(() => {
        if (callbackOptions.onFinish) {
          callbackOptions.onFinish();
        }
      });
  },
}));

export default useGlobalStore;
