import { useEffect, useState } from "react";
import { RefreshIcon, TerminalIcon } from "@heroicons/react/solid";
import CreateNewConfigModal from "./Modal/CreateNewConfigModal";
import useGlobalStore from "../hooks/useGlobalStore";

export default function Admin() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const configs = useGlobalStore((state) => state.configs);
  const wallet = useGlobalStore((state) => state.wallet);
  const loading = useGlobalStore((state) => state.fetchConfigsLoading);
  const success = useGlobalStore((state) => state.fetchConfigsSuccess);
  const running = useGlobalStore((state) => state.fetchConfigsRunning);
  const fetchConfigs = useGlobalStore((state) => state.fetchConfigs);

  const myConfigs =
    configs.length > 0
      ? configs.filter(
          (config) =>
            config?.account["admin"].toString() === wallet?.publicKey.toBase58()
        )
      : [];

  useEffect(() => {
    if (!success && !loading && !running) fetchConfigs();
  }, [fetchConfigs, loading, success, running]);

  return (
    <div className="text-sm">
      <h2 className="mt-2 mb-4 text-slate-600 dark:text-gray-200 font-medium text-xs">
        Staking Config
      </h2>
      <hr className="-mt-3 mb-4" />
      <button
        className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 w-full"
        onClick={() => setIsModalOpen(true)}
      >
        New Config <TerminalIcon height={20} className="ml-2" />
      </button>

      <div>
        <h2 className="mt-8 my-4">
          <span className="text-slate-600 dark:text-gray-200 font-medium text-xs">
            My config ({myConfigs.length}):
          </span>
          <button
            className="rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 hover:opacity-90 p-1 ml-2"
            onClick={fetchConfigs}
          >
            <RefreshIcon
              height={14}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </h2>
        <hr className="-mt-3 mb-4" />

        {myConfigs.length > 0
          ? myConfigs.map((item: any, index) => (
              <div key={item.publicKey} className="text-xs mt-4">
                <span className="py-0.5 px-2 mr-2 border rounded-md text-slate-600 dark:text-gray-200">
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
          <span className="text-slate-600 dark:text-gray-200 font-medium text-xs">
            Available configs by all admins ({configs.length}):
          </span>
          <button
            className="rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 hover:opacity-90 p-1 ml-2"
            onClick={fetchConfigs}
          >
            <RefreshIcon
              height={14}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </h2>
        <hr className="-mt-3 mb-4" />

        {configs.length > 0
          ? configs.map((item: any, index) => (
              <div key={item.publicKey} className="text-xs mt-4">
                <span className="py-0.5 px-2 mr-2 border rounded-md text-slate-600 dark:text-gray-200">
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
