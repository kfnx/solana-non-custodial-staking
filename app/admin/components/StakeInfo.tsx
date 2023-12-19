import { useEffect, useState } from "react";
import * as anchor from "@project-serum/anchor";
import { RefreshIcon } from "@heroicons/react/solid";
import useGlobalStore from "../hooks/useGlobalStore";
import StakeInfoSection from "./StakeInfoSection";
import { Connection, PublicKey } from "@solana/web3.js";
import { findStakeInfoPDA } from "../sdk/pda";
import { IDL, NcStaking } from "../sdk/nc_staking";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import ConfigSelector from "./ConfigSelector";
import toast from "react-hot-toast";

async function checkStakeInfo(
  connection: Connection,
  wallet: AnchorWallet,
  programId: PublicKey,
  user: string,
  mint: string,
  successCallback: any // function
) {
  const userPK = new PublicKey(user);
  const mintPK = new PublicKey(mint);
  const [stakeInfoPDA] = await findStakeInfoPDA(userPK, mintPK, programId);
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
  const program = new anchor.Program<NcStaking>(IDL, programId, provider);
  const stakeInfo = await program.account.stakeInfo.fetch(stakeInfoPDA);
  successCallback(stakeInfo);
}

export default function StakeInfo() {
  const stakeInfo = useGlobalStore((state) => state.stakeInfo);
  const loading = useGlobalStore((state) => state.fetchStakeInfoLoading);
  const success = useGlobalStore((state) => state.fetchStakeInfoSuccess);
  const fetchStakeInfo = useGlobalStore((state) => state.fetchStakeInfo);
  const wallet = useGlobalStore((state) => state.wallet);
  const connection = useGlobalStore((state) => state.connection);
  const getProgramId = useGlobalStore((state) => state.getProgramID);
  const programId = getProgramId();
  console.log("stakeInfo", stakeInfo);

  const [checkedStakeInfo, setStakeInfo] = useState<any>();
  const [user, setUser] = useState<string>(wallet?.publicKey.toBase58() || "");
  const [mint, setMint] = useState<string>(
    "4iWniuvrXmPvaoufVngsQWceV72cK8AkZTKiXN1x3s2p"
  );

  useEffect(() => {
    if (!success && !loading) fetchStakeInfo();
  }, [fetchStakeInfo, loading, success]);

  return (
    <div className="text-sm">
      <h2 className="mb-4 text-slate-600 dark:text-gray-200 font-medium text-xs">
        <span className="text-slate-600 dark:text-gray-200 font-medium text-xs">
          Find Stake Info ({stakeInfo.length}):
        </span>
        <span className="p-4">TODO add sort</span>
      </h2>
      <hr className="-mt-3 mb-4" />
      <ConfigSelector />
      <div className="mb-2">
        <label
          htmlFor="reward-mint"
          className="block mb-2 text-sm text-gray-500"
        >
          User:
        </label>
        <input
          type="text"
          id="user"
          className="bg-gray-200 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
          placeholder={wallet?.publicKey.toBase58()}
          required
          value={user}
          onChange={(event) => setUser(event.target.value)}
        />
      </div>
      <div className="mb-2">
        <label
          htmlFor="reward-mint"
          className="block mb-2 text-sm text-gray-500"
        >
          Mint:
        </label>
        <input
          type="text"
          id="mint"
          className="bg-gray-200 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
          placeholder={wallet?.publicKey.toBase58()}
          required
          value={mint}
          onChange={(event) => setMint(event.target.value)}
        />
      </div>
      <button
        className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 w-full"
        onClick={() => {
          try {
            toast.promise(
              checkStakeInfo(
                connection,
                wallet!,
                programId,
                user!,
                mint!,
                setStakeInfo
              ),
              {
                loading: "Checking stake info..",
                success: "Checking stake info Finished",
                error: "Checking stake info Failed",
              }
            );
          } catch (error) {
            console.error(error);
            toast.error("Invalid input");
          }
        }}
      >
        Check stake info
      </button>
      <pre className="my-4 min-h-[64px] border-slate-500 border-2 p-1 text-xs">
        {JSON.stringify(checkedStakeInfo, null, 2)}
      </pre>

      <h2 className="mb-4 text-slate-600 dark:text-gray-200 font-medium text-xs">
        <span className="text-slate-600 dark:text-gray-200 font-medium text-xs">
          Stake Info ({stakeInfo.length}):
        </span>
        <button
          className="rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 hover:opacity-90 p-1 ml-2"
          onClick={fetchStakeInfo}
        >
          <RefreshIcon height={14} className={loading ? "animate-spin" : ""} />
        </button>
        <span className="p-4">TODO add sort</span>
      </h2>
      <hr className="-mt-3 mb-4" />
      <StakeInfoSection stakes={stakeInfo} />
    </div>
  );
}
