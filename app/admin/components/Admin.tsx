import * as anchor from "@project-serum/anchor";
import {
  AnchorWallet,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { CogIcon, RefreshIcon } from "@heroicons/react/solid";
import { IDL, NcStaking, PROGRAM_ID } from "../sdk";
import CreateNewConfigModal from "./CreateNewConfig";
import toast from "react-hot-toast";

const getAllConfigs = async (connection: Connection, wallet: AnchorWallet) => {
  try {
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      anchor.AnchorProvider.defaultOptions()
    );
    const program = new anchor.Program<NcStaking>(IDL, PROGRAM_ID, provider);
    return await program.account.stakingConfig.all();
  } catch (error) {
    console.error(error);
    toast.error("Fetching Config failed");
    return [];
  }
};

export default function Admin() {
  const [data, setData] = useState<any>([]);
  const [isOpenNewConfig, setIsOpenNewConfig] = useState(false);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  useEffect(() => {
    (async () => {
      if (wallet) {
        const configs = await getAllConfigs(connection, wallet);
        setData(configs);
      }
    })();
  }, [connection, wallet]);

  return (
    <div>
      <h2 className="mt-2 mb-4">Staking Config</h2>
      <button
        className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 font-medium hover:opacity-90 text-sm w-full"
        onClick={() => setIsOpenNewConfig(true)}
      >
        New Config <CogIcon height={24} className="ml-2" />
      </button>

      {data.length === 0 ? (
        <div className="my-4">No config found</div>
      ) : (
        <div>
          <h2 className="mt-8 my-4">
            Available configs ({data.length}):
            <button
              className="rounded-md shadow bg-blue-900/20 text-slate-600 hover:opacity-90 p-1 ml-2"
              onClick={async () => {
                const configs = toast.promise(
                  getAllConfigs(connection, wallet!),
                  {
                    loading: "Refetching..",
                    success: "Refetch success",
                    error: "Refetch error",
                  }
                );
                setData(await configs);
              }}
            >
              <RefreshIcon height={16} />
            </button>
          </h2>

          {data.map((config: any) => (
            <div key={config.publicKey} className="text-xs mt-4">
              <b>{config.publicKey.toString()}</b>
              <div className="flex flex-column flex-wrap mt-2">
                {Object.keys(config.account).map((v, id) => (
                  <div key={id} className="flex w-full justify-between my-0.5">
                    <span>{v}</span>
                    <br />
                    <span>{config.account[v].toString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <CreateNewConfigModal
        isOpen={isOpenNewConfig}
        setIsOpen={setIsOpenNewConfig}
      />
    </div>
  );
}
