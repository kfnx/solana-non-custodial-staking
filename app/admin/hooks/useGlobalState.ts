import create, { GetState } from "zustand";
import * as anchor from "@project-serum/anchor";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import toast from "react-hot-toast";
import {
  findDelegateAuthPDA,
  findEditionPDA,
  findMetadataPDA,
  findStakeInfoPDA,
  findUserATA,
  findUserStatePDA,
  findWhitelistPDA,
  IDL,
  NcStaking,
  PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID,
} from "../sdk";
import { WalletError } from "@solana/wallet-adapter-base";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

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
const AnchorProgramBuilder = (
  get: GetState<GlobalState>
): anchor.Program<NcStaking> | WalletError => {
  const { wallet, connection } = get();
  if (!wallet) {
    toast.error("Wallet Not Connected");
    return new WalletError();
  }

  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
  return new anchor.Program<NcStaking>(IDL, PROGRAM_ID, provider);
};

interface StakeInstructionAccounts {
  mint: PublicKey;
  config: PublicKey;
}

interface GlobalState {
  // setters
  connection: Connection;
  setConnection: (wallet: Connection) => void;
  wallet: undefined | AnchorWallet;
  setWallet: (wallet: AnchorWallet) => void;
  network: Network;
  setNetwork: (network: Network) => void;
  users: any[];
  isFetchingUsers: boolean;
  myNFT: INFT[];
  fetchMyNFT: () => void;
  configs: any[];
  isFetchingConfigs: boolean;
  config: number;
  setConfig: (index: number) => void;
  selectedNFT: undefined | PublicKey;
  selectNFT: (mint: PublicKey) => void;
  // program account fetch
  fetchUsers: () => void;
  fetchConfigs: () => void;
  // instruction dispatch
  initiateStaking: (cbOptions: CallbackOptions) => void;
  stake: (cbOptions: CallbackOptions) => void;
  unstake: (cbOptions: CallbackOptions) => void;
  claim: (cbOptions: CallbackOptions) => void;
}

const useGlobalState = create<GlobalState>((set, get) => ({
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
  users: [],
  isFetchingUsers: false,
  myNFT: [],
  fetchMyNFT: async () => {
    // const myNFT = program.fetch
    set({ myNFT: [] });
  },
  configs: [],
  isFetchingConfigs: false,
  config: 0,
  setConfig: (index) => {
    set({ config: index });
  },
  selectedNFT: undefined,
  selectNFT: (selectedNFT) => {
    set({ selectedNFT });
  },
  // program accounts fetchs
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
  // instruction dispatcher
  initiateStaking: async (callbackOptions) => {
    if (callbackOptions.onStart) {
      callbackOptions.onStart();
    }
    const ixName = "Init staking";
    const { connection, wallet, configs, config } = get();
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
        loading: `${ixName}...`,
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

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      anchor.AnchorProvider.defaultOptions()
    );
    const program = new anchor.Program<NcStaking>(IDL, PROGRAM_ID, provider);

    const configId = new PublicKey(configs[config].publicKey);

    const userATA = await findUserATA(wallet.publicKey, selectedNFT);
    // console.log("user ATA", userATA.toBase58());
    const [delegate] = await findDelegateAuthPDA(userATA);
    // console.log("user delegate", delegate.toBase58());
    const [edition] = await findEditionPDA(selectedNFT);
    // console.log("edition", edition.toBase58());
    const [userState] = await findUserStatePDA(wallet.publicKey, configId);
    // console.log("user state", justinState.toBase58());
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
        tokenAccount: userATA,
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
        loading: `${ixName}...`,
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
  unstake: async (callbackOptions) => {},
  claim: async () => {},
}));

export default useGlobalState;
