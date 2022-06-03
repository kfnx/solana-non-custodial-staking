import { useEffect, useState } from "react";
import {
  HandIcon,
  LockClosedIcon,
  LockOpenIcon,
  RefreshIcon,
  UserAddIcon,
} from "@heroicons/react/solid";
import InitStakingModal from "./Modal/InitStakingModal";
import useGlobalStore from "../hooks/useGlobalStore";
import ConfigSelector from "./ConfigSelector";
import StakeModal from "./Modal/StakeModal";
import UnstakeModal from "./Modal/UnstakeModal";
import ClaimModal from "./Modal/ClaimModal";

export default function User() {
  const [isModalOpenInitStaking, setIsModalOpenInitStaking] = useState(false);
  const [isModalOpenStake, setIsModalOpenStake] = useState(false);
  const [isModalOpenUnstake, setIsModalOpenUnstake] = useState(false);
  const [isModalOpenClaim, setIsModalOpenClaim] = useState(false);
  const users = useGlobalStore((state) => state.users);
  const loading = useGlobalStore((state) => state.fetchUsersLoading);
  const success = useGlobalStore((state) => state.fetchUsersSuccess);
  const running = useGlobalStore((state) => state.fetchUsersRunning);
  const fetchUsers = useGlobalStore((state) => state.fetchUsers);
  const userState = useGlobalStore((state) => state.userState);
  const wallet = useGlobalStore((state) => state.wallet);

  const myInitiatedStakings =
    users.length > 0
      ? users.filter(
          (user) =>
            user?.account["user"].toString() === wallet?.publicKey.toBase58()
        )
      : [];

  useEffect(() => {
    if (!success && !loading && !running) fetchUsers();
  }, [fetchUsers, loading, success, running]);

  return (
    <div className="text-sm">
      <h2 className="mt-2 mb-4 text-slate-600 dark:text-gray-200 font-medium text-xs">
        Staking
      </h2>
      <hr className="-mt-3 mb-4" />
      <ConfigSelector />
      <button
        className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 w-full"
        onClick={() => setIsModalOpenInitStaking(true)}
      >
        Initiate staking <UserAddIcon height={20} className="ml-2" />
      </button>
      <p className="mt-2 text-center">
        user state in selected config:{" "}
        {userState ? "initiated" : "not initiated"}{" "}
      </p>
      <div className="grid grid-cols-3 gap-2 my-2">
        <button
          className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 disabled:cursor-not-allowed"
          onClick={() => setIsModalOpenStake(true)}
          disabled={!userState}
        >
          Stake
          <LockClosedIcon height={20} className="ml-2" />
        </button>
        <button
          className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 disabled:cursor-not-allowed"
          onClick={() => setIsModalOpenUnstake(true)}
          disabled={!userState}
        >
          Unstake
          <LockOpenIcon height={20} className="ml-2" />
        </button>
        <button
          className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 disabled:cursor-not-allowed"
          onClick={() => setIsModalOpenClaim(true)}
          disabled={!userState}
        >
          Claim
          <HandIcon height={20} className="ml-2" />
        </button>
      </div>

      <div>
        <h2 className="mt-8 my-4">
          <span className="text-slate-600 dark:text-gray-200 font-medium text-xs">
            My initated stakings ({myInitiatedStakings.length}):
          </span>
          <button
            className="rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 hover:opacity-90 p-1 ml-2"
            onClick={fetchUsers}
          >
            <RefreshIcon
              height={14}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </h2>
        <hr className="-mt-3 mb-4" />

        {myInitiatedStakings.length > 0
          ? myInitiatedStakings.map((item: any, index) => (
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
                      <span>{item.account[v].toString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          : "No initiated staking found"}

        <h2 className="mt-8 my-4">
          <span className="text-slate-600 dark:text-gray-200 font-medium text-xs">
            Available users that initiated staking ({users.length}):
          </span>
          <button
            className="rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 hover:opacity-90 p-1 ml-2"
            onClick={fetchUsers}
          >
            <RefreshIcon
              height={14}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </h2>
        <hr className="-mt-3 mb-4" />

        {users.length > 0
          ? users.map((item: any, index) => (
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
                      <span>{item.account[v].toString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          : "No initiated staking found"}
      </div>
      <InitStakingModal
        isOpen={isModalOpenInitStaking}
        setIsOpen={setIsModalOpenInitStaking}
      />
      <StakeModal isOpen={isModalOpenStake} setIsOpen={setIsModalOpenStake} />
      <UnstakeModal
        isOpen={isModalOpenUnstake}
        setIsOpen={setIsModalOpenUnstake}
      />
      <ClaimModal isOpen={isModalOpenClaim} setIsOpen={setIsModalOpenClaim} />
    </div>
  );
}
