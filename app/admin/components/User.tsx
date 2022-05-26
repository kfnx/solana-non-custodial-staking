import { useEffect, useState } from "react";
import { RefreshIcon, UserAddIcon } from "@heroicons/react/solid";
import InitiateStakingModal from "./InitiateStakingModal";
import useGlobalState from "../hooks/useGlobalState";

export default function User() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const users = useGlobalState((state) => state.users);
  const isFetchingUsers = useGlobalState((state) => state.isFetchingUsers);
  const fetchUsers = useGlobalState((state) => state.fetchUsers);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div>
      <h2 className="mt-2 mb-4">Staking</h2>
      <button
        className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 font-medium hover:opacity-90 text-sm w-full"
        onClick={() => setIsModalOpen(true)}
      >
        Initiate staking w/ connected wallet{" "}
        <UserAddIcon height={24} className="ml-2" />
      </button>

      {users.length === 0 ? (
        <div className="my-4">No user found</div>
      ) : (
        <div>
          <h2 className="mt-8 my-4">
            Available users from all configs ({users.length}):
            <button
              className="rounded-md shadow bg-blue-900/20 text-slate-600 hover:opacity-90 p-1 ml-2"
              onClick={fetchUsers}
            >
              <RefreshIcon
                height={16}
                className={isFetchingUsers ? "animate-spin" : ""}
              />
            </button>
          </h2>

          {users.map((config: any) => (
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
      <InitiateStakingModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} />
    </div>
  );
}
