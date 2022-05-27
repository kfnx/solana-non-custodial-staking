import { useEffect, useState } from "react";
import { RefreshIcon, TerminalIcon } from "@heroicons/react/solid";
import CreateNewConfigModal from "./Modal/CreateNewConfigModal";
import useGlobalState from "../hooks/useGlobalState";

export default function Admin() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const configs = useGlobalState((state) => state.configs);
  const isFetchingConfigs = useGlobalState((state) => state.isFetchingConfigs);
  const fetchConfigs = useGlobalState((state) => state.fetchConfigs);
  const wallet = useGlobalState((state) => state.wallet);

  const myConfigs =
    configs.length > 0
      ? configs.filter(
          (config) =>
            config?.account["admin"].toString() === wallet?.publicKey.toBase58()
        )
      : [];

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return (
    <div className="text-sm">
      <h2 className="mt-2 mb-4 text-slate-600 font-medium text-xs">
        Staking Config
      </h2>
      <hr className="-mt-3 mb-4" />
      <button
        className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 font-medium hover:opacity-90 w-full"
        onClick={() => setIsModalOpen(true)}
      >
        New Config <TerminalIcon height={20} className="ml-2" />
      </button>

      <div>
        <h2 className="mt-8 my-4">
          <span className="text-slate-600 font-medium text-xs">
            My config ({myConfigs.length}):
          </span>
          <button
            className="rounded-md shadow bg-blue-900/20 text-slate-600 hover:opacity-90 p-1 ml-2"
            onClick={fetchConfigs}
          >
            <RefreshIcon
              height={14}
              className={isFetchingConfigs ? "animate-spin" : ""}
            />
          </button>
        </h2>
        <hr className="-mt-3 mb-4" />

        {myConfigs.length > 0
          ? myConfigs.map((item: any, index) => (
              <div key={item.publicKey} className="text-xs mt-4">
                <span className="py-0.5 px-2 mr-2 border rounded-md text-slate-600">
                  {index + 1}
                </span>
                <div className="flex flex-column flex-wrap mt-2">
                  <div className="flex w-full justify-between my-0.5">
                    <span>PDA</span>
                    <span>{item.publicKey.toString()}</span>
                  </div>
                  {Object.keys(item.account).map((v, id) => (
                    <div
                      key={id}
                      className="flex w-full justify-between my-0.5"
                    >
                      <span>{v}</span>
                      <br />
                      <span>{item.account[v].toString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          : "No Config found"}

        <h2 className="mt-8 my-4">
          <span className="text-slate-600 font-medium text-xs">
            Available configs by all admins ({configs.length}):
          </span>
          <button
            className="rounded-md shadow bg-blue-900/20 text-slate-600 hover:opacity-90 p-1 ml-2"
            onClick={fetchConfigs}
          >
            <RefreshIcon
              height={14}
              className={isFetchingConfigs ? "animate-spin" : ""}
            />
          </button>
        </h2>
        <hr className="-mt-3 mb-4" />

        {configs.length > 0
          ? configs.map((item: any, index) => (
              <div key={item.publicKey} className="text-xs mt-4">
                <span className="py-0.5 px-2 mr-2 border rounded-md text-slate-600">
                  {index + 1}
                </span>
                <div className="flex flex-column flex-wrap mt-2">
                  <div className="flex w-full justify-between my-0.5">
                    <span>PDA</span>
                    <span>{item.publicKey.toString()}</span>
                  </div>
                  {Object.keys(item.account).map((v, id) => (
                    <div
                      key={id}
                      className="flex w-full justify-between my-0.5"
                    >
                      <span>{v}</span>
                      <br />
                      <span>{item.account[v].toString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          : "No config found"}
      </div>
      <CreateNewConfigModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
    </div>
  );
}
