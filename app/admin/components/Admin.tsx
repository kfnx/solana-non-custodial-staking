import { useEffect, useState } from "react";
import { CogIcon, RefreshIcon } from "@heroicons/react/solid";
import CreateNewConfigModal from "./CreateNewConfig";
import useGlobalState from "../hooks/useGlobalState";

export default function Admin() {
  const [isOpenNewConfig, setIsOpenNewConfig] = useState(false);
  const configs = useGlobalState((state) => state.configs);
  const isFetchingConfigs = useGlobalState((state) => state.isFetchingConfigs);
  const fetchConfigs = useGlobalState((state) => state.fetchConfigs);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return (
    <div>
      <h2 className="mt-2 mb-4">Staking Config</h2>
      <button
        className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 font-medium hover:opacity-90 text-sm w-full"
        onClick={() => setIsOpenNewConfig(true)}
      >
        New Config <CogIcon height={24} className="ml-2" />
      </button>

      {configs.length === 0 ? (
        <div className="my-4">No config found</div>
      ) : (
        <div>
          <h2 className="mt-8 my-4">
            Available configs ({configs.length}):
            <button
              className="rounded-md shadow bg-blue-900/20 text-slate-600 hover:opacity-90 p-1 ml-2"
              onClick={fetchConfigs}
            >
              <RefreshIcon
                height={16}
                className={isFetchingConfigs ? "animate-spin" : ""}
              />
            </button>
          </h2>

          {configs.map((config: any) => (
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
