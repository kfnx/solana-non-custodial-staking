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
import useWalletNfts from "../hooks/useWalletNFT";

export default function User() {
  const [showInitStake, setShowInitStake] = useState(false);
  const [showStake, setShowStake] = useState(false);
  const [showUnstake, setShowUnstake] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [mintAmount, setMintAmount] = useState(1);
  const users = useGlobalStore((state) => state.users);
  const oldUsers = useGlobalStore((state) => state.oldUsers);
  const loading = useGlobalStore((state) => state.fetchUsersLoading);
  const success = useGlobalStore((state) => state.fetchUsersSuccess);
  const fetchUsers = useGlobalStore((state) => state.fetchUsers);
  const config = useGlobalStore((state) => state.config);
  const configs = useGlobalStore((state) => state.configs);
  const initiated = useGlobalStore((state) => state.userConfigV2Initiated);
  const v1initiated = useGlobalStore((state) => state.userConfigV1Initiated);
  const migrated = useGlobalStore((state) => state.userConfigV1MigratedToV2);
  const checkUser = useGlobalStore((state) => state.checkUserConfig);
  const upgrade = useGlobalStore((state) => state.upgrade);
  const balance = useGlobalStore((state) => state.userTokenBalance);
  const fetchBalance = useGlobalStore((state) => state.fetchUserTokenBalance);
  const wallet = useGlobalStore((state) => state.wallet);

  const { refetchNFT, isLoading } = useWalletNfts();

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
    if (initiated && configs.length > 0) fetchBalance();
  }, [initiated, configs.length, fetchBalance]);

  return (
    <div className="text-sm">
      <h2 className="mb-4 text-slate-600 dark:text-gray-200 font-medium text-xs">
        <span className="text-slate-600 dark:text-gray-200 font-medium text-xs">
          User NFTs
        </span>
        <button
          className="rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 hover:opacity-90 p-1 ml-2"
          onClick={refetchNFT}
        >
          <RefreshIcon
            height={14}
            className={isLoading ? "animate-spin" : ""}
          />
        </button>
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
      <div className="flex w-full space-x-2">
        <button
          className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 w-9/12"
          onClick={() =>
            toast.promise(mintWhitelistedNFTs(mintAmount), {
              loading: "Minting..",
              success: "Minting Finished",
              error: "Minting Failed",
            })
          }
        >
          Mint whitelisted NFTs
        </button>
        <div className="flex h-10 w-3/12 rounded-lg relative bg-transparent">
          <button
            className=" bg-gray-300 text-gray-600 hover:text-gray-700 hover:bg-gray-400 h-full w-20 rounded-l cursor-pointer outline-none"
            onClick={() => setMintAmount((amount) => amount - 1)}
            disabled={mintAmount === 1}
          >
            <span className="m-auto text-2xl font-thin">−</span>
          </button>
          <input
            type="number"
            className="outline-none focus:outline-none text-center w-full bg-gray-300 font-semibold text-md hover:text-black focus:text-black  md:text-basecursor-default flex items-center text-gray-700"
            name="custom-input-number"
            value={mintAmount}
            readOnly
          ></input>
          <button
            className="bg-gray-300 text-gray-600 hover:text-gray-700 hover:bg-gray-400 h-full w-20 rounded-r cursor-pointer"
            onClick={() => setMintAmount((amount) => amount + 1)}
            disabled={mintAmount === 10}
          >
            <span className="m-auto text-2xl font-thin">+</span>
          </button>
        </div>
      </div>

      <h2 className="mt-4 mb-4 text-slate-600 dark:text-gray-200 font-medium text-xs">
        Staking
      </h2>
      <hr className="-mt-3 mb-4" />
      <ConfigSelector />
      <p className="my-2 text-center">
        {initiated ? "✅ initiated" : "❌ not initiated"}{" "}
      </p>
      {v1initiated && !migrated && (
        <p className="my-2 text-center">
          ☢️ This user use old PDA, please migrate to new PDA
        </p>
      )}
      <button
        className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 w-full disabled:cursor-not-allowed"
        onClick={() => setShowInitStake(true)}
        disabled={v1initiated || initiated}
      >
        Initiate staking <UserAddIcon height={20} className="ml-2" />
      </button>
      <div className="grid grid-cols-3 gap-2 my-2">
        <button
          className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 disabled:cursor-not-allowed"
          onClick={() => setShowStake(true)}
          disabled={!initiated}
        >
          Stake
          <LockClosedIcon height={20} className="ml-2" />
        </button>
        <button
          className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 disabled:cursor-not-allowed"
          onClick={() => setShowUnstake(true)}
          disabled={!initiated}
        >
          Unstake
          <LockOpenIcon height={20} className="ml-2" />
        </button>
        <button
          className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 disabled:cursor-not-allowed"
          onClick={() => setShowClaim(true)}
          disabled={!initiated}
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

        <h2 className="mt-4 mb-4 text-slate-600 dark:text-gray-200 font-medium text-xs">
          Migrate PDA for old users
        </h2>
        <hr className="-mt-3 mb-4" />
        <ConfigSelector />
        <p className="my-2 text-center">
          {v1initiated && !initiated && "☢️ Old PDA detected, Please Migrate"}
        </p>
        <button
          className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 w-full disabled:cursor-not-allowed"
          onClick={upgrade}
          disabled={initiated}
        >
          Migrate <UserAddIcon height={20} className="ml-2" />
        </button>

        <h2 className="mt-8 my-4">
          <span className="text-slate-600 dark:text-gray-200 font-medium text-xs">
            old staking acc (please migrate) ({oldUsers.length}):
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
        <UserStakings stakings={oldUsers} />
      </div>
      <InitStakingModal isOpen={showInitStake} setIsOpen={setShowInitStake} />
      <StakeModal isOpen={showStake} setIsOpen={setShowStake} />
      <UnstakeModal isOpen={showUnstake} setIsOpen={setShowUnstake} />
      <ClaimModal isOpen={showClaim} setIsOpen={setShowClaim} />
    </div>
  );
}
