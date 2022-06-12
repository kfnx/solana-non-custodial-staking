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
import { unixTimeConverter } from "../utils/unixTimeConverter";

const UserStakings: React.FC<{ stakings: any[] }> = ({ stakings }) => {
  if (stakings.length === 0) {
    return <span>No initiated staking found</span>;
  }

  return (
    <>
      {stakings.map((item: any, index) => (
        <div key={item.publicKey} className="text-xs mt-4">
          <span className="py-0.5 px-2 mr-2 border rounded-md text-slate-600 dark:text-gray-200">
            {index + 1}
          </span>
          <div className="flex flex-column flex-wrap mt-2">
            <div className="flex w-full justify-between my-0.5 bg-slate-200">
              <span>PDA</span>
              <span>{item.publicKey.toString()}</span>
            </div>
            {Object.keys(item.account).map((v, id) => {
              const className = `flex w-full justify-between my-0.5${
                id % 2 ? " bg-slate-200" : ""
              }`;

              if (v === "lastStakeTime" || v === "timeLastClaim") {
                const unixTime = item.account[v].toNumber();
                const time = unixTime ? unixTimeConverter(unixTime) : "Never";
                return (
                  <div key={id} className={className}>
                    <span>{v}</span>
                    <span>
                      {unixTime} | {time}
                    </span>
                  </div>
                );
              }
              return (
                <div key={id} className={className}>
                  <span>{v}</span>
                  <span>{item.account[v].toString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
};

export default function User() {
  const [showInitStake, setShowInitStake] = useState(false);
  const [showStake, setShowStake] = useState(false);
  const [showUnstake, setShowUnstake] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const users = useGlobalStore((state) => state.users);
  const loading = useGlobalStore((state) => state.fetchUsersLoading);
  const success = useGlobalStore((state) => state.fetchUsersSuccess);
  const fetchUsers = useGlobalStore((state) => state.fetchUsers);
  const config = useGlobalStore((state) => state.config);
  const configs = useGlobalStore((state) => state.configs);
  const userInitiated = useGlobalStore((state) => state.userInitiated);
  const checkUser = useGlobalStore((state) => state.checkUserInitiated);
  const balance = useGlobalStore((state) => state.userTokenBalance);
  const fetchBalance = useGlobalStore((state) => state.fetchUserTokenBalance);
  const wallet = useGlobalStore((state) => state.wallet);

  const myInitiatedStakings =
    users.length > 0
      ? users.filter(
          (user) =>
            user?.account["user"].toString() === wallet?.publicKey.toBase58()
        )
      : [];

  useEffect(() => {
    if (!success && !loading) fetchUsers();
  }, [fetchUsers, loading, success]);

  useEffect(() => {
    if (wallet && configs.length > 0) checkUser();
  }, [checkUser, config, configs.length, wallet]);

  useEffect(() => {
    if (userInitiated && configs.length > 0) fetchBalance();
  }, [userInitiated, configs.length, fetchBalance]);

  return (
    <div className="text-sm">
      <h2 className="mt-2 mb-4 text-slate-600 dark:text-gray-200 font-medium text-xs">
        Staking
      </h2>
      <hr className="-mt-3 mb-4" />
      <ConfigSelector />
      <button
        className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 w-full"
        onClick={() => setShowInitStake(true)}
      >
        Initiate staking <UserAddIcon height={20} className="ml-2" />
      </button>
      <p className="mt-2 text-center">
        user state in selected config:{" "}
        {userInitiated ? "✅ initiated" : "❌ not initiated"}{" "}
      </p>
      <div className="grid grid-cols-3 gap-2 my-2">
        <button
          className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 disabled:cursor-not-allowed"
          onClick={() => setShowStake(true)}
          disabled={!userInitiated}
        >
          Stake
          <LockClosedIcon height={20} className="ml-2" />
        </button>
        <button
          className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 disabled:cursor-not-allowed"
          onClick={() => setShowUnstake(true)}
          disabled={!userInitiated}
        >
          Unstake
          <LockOpenIcon height={20} className="ml-2" />
        </button>
        <button
          className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 disabled:cursor-not-allowed"
          onClick={() => setShowClaim(true)}
          disabled={!userInitiated}
        >
          Claim
          <HandIcon height={20} className="ml-2" />
        </button>
      </div>

      <div>
        <h2 className="mt-8 my-4">
          <span className="text-slate-600 dark:text-gray-200 font-medium text-xs">
            My token reward balance: {balance}
          </span>
          <button
            className="rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 hover:opacity-90 p-1 ml-2"
            onClick={fetchBalance}
          >
            <RefreshIcon
              height={14}
              className={loading ? "animate-spin" : ""}
            />
          </button>
        </h2>
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

        <UserStakings stakings={myInitiatedStakings} />

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

        <UserStakings stakings={users} />
      </div>
      <InitStakingModal isOpen={showInitStake} setIsOpen={setShowInitStake} />
      <StakeModal isOpen={showStake} setIsOpen={setShowStake} />
      <UnstakeModal isOpen={showUnstake} setIsOpen={setShowUnstake} />
      <ClaimModal isOpen={showClaim} setIsOpen={setShowClaim} />
    </div>
  );
}
