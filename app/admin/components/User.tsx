import { useEffect, useState } from "react";
import {
  HandIcon,
  LockClosedIcon,
  LockOpenIcon,
  RefreshIcon,
  UserAddIcon,
} from "@heroicons/react/solid";
import toast from "react-hot-toast";
import InitStakingModal from "./Modal/InitStakingModal";
import useGlobalStore from "../hooks/useGlobalStore";
import ConfigSelector from "./ConfigSelector";
import StakeModal from "./Modal/StakeModal";
import UnstakeModal from "./Modal/UnstakeModal";
import ClaimModal from "./Modal/ClaimModal";
import UserNFTs from "./UserNFTs";
import UserStakings from "./UserStakings";
import mintWhitelistedNFTs from "../utils/mintWhitelistedNFTs";
import { NFT_CREATOR_ID } from "../sdk/address";

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
      <h2 className="mb-4 text-slate-600 dark:text-gray-200 font-medium text-xs">
        User NFTs
      </h2>
      <hr className="-mt-3 mb-4" />
      <UserNFTs cardSize={48} />

      <h2 className="mt-4 mb-4 text-slate-600 dark:text-gray-200 font-medium text-xs">
        Minting
      </h2>
      <hr className="-mt-3 mb-4" />
      <div className="my-2">
        <p className="block mb-2 text-sm text-gray-500">Creator Address</p>
        <div className="bg-gray-200 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 hover:cursor-not-allowed">
          {NFT_CREATOR_ID.toBase58()}
        </div>
      </div>
      <button
        className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 w-full"
        onClick={() =>
          toast.promise(mintWhitelistedNFTs(), {
            loading: "Minting..",
            success: "Minting Finished",
            error: "Minting Failed",
          })
        }
      >
        Mint whitelisted NFTs
      </button>

      <h2 className="mt-4 mb-4 text-slate-600 dark:text-gray-200 font-medium text-xs">
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
