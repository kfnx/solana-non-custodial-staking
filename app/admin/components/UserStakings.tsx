import { PublicKey } from "@solana/web3.js";
import { useEffect } from "react";
import useGlobalStore, { UserStateWrapper } from "../hooks/useGlobalStore";
import { findUserStatePDA, findUserStateV2PDA } from "../sdk/pda";
import { convertSecondsToReadableTime } from "../utils/convertSecToReadableTime";
import { unixTimeConverter } from "../utils/unixTimeConverter";

function readLockTime(configs: any[], configId: PublicKey) {
  const config = configs.find(
    (config) => config.publicKey.toString() === configId.toString()
  );

  if (config?.account) {
    return (
      convertSecondsToReadableTime(
        Number(config.account.stakingLockDurationInSec.toString())
      ) || " Flexible"
    );
  }
}

const UserState: React.FC<{
  index: number;
  configs: any[];
  item: UserStateWrapper;
  oldAccount: boolean;
}> = ({ index, configs, item, oldAccount }) => {
  const upgrade = useGlobalStore((state) => state.upgradeOnBehalf);

  return (
    <div className="text-xs mt-4">
      <span className="py-0.5 px-2 mr-2 border rounded-md text-slate-600 dark:text-gray-200">
        {index + 1}
      </span>
      <div className="flex flex-column flex-wrap mt-2">
        <div className="flex w-full justify-between my-0.5">
          <span>Lock Duration</span>
          <span>{readLockTime(configs, item.account.config)}</span>
        </div>
        <div className="flex w-full justify-between my-0.5 bg-slate-200 dark:bg-slate-500/75">
          <span>PDA</span>
          <span>{item.publicKey.toString()}</span>
        </div>
        {Object.entries(item.account).map(([k, v], id) => {
          const className = `flex w-full justify-between my-0.5${
            id % 2 ? " bg-slate-200 dark:bg-slate-500/75" : ""
          }`;

          if (
            ["timeStakingStart", "timeLastClaim", "timeLastStake"].includes(k)
          ) {
            const unixTime = Number(v);
            const time = unixTime ? unixTimeConverter(unixTime) : "Never";
            return (
              <div key={id} className={className}>
                <span>{k}</span>
                <span>
                  {unixTime} | {time}
                </span>
              </div>
            );
          }
          return (
            <div key={id} className={className}>
              <span>{k}</span>
              <span>{v.toString()}</span>
            </div>
          );
        })}

        {oldAccount && (
          <button
            className="inline-flex items-center justify-center h-10 px-6 rounded-md shadow bg-blue-900/20 text-slate-600 dark:text-gray-200 font-medium hover:opacity-90 w-full disabled:cursor-not-allowed"
            onClick={() => {
              upgrade(item.account.user, item.account.config);
            }}
          >
            Migrate
          </button>
        )}
      </div>
    </div>
  );
};

const UserStakings: React.FC<{
  stakings: UserStateWrapper[];
  oldAccount?: boolean;
}> = ({ stakings, oldAccount = false }) => {
  const configs = useGlobalStore((state) => state.configs);

  if (stakings.length === 0) {
    return <span>No initiated staking found</span>;
  }
  return (
    <>
      {stakings.map(
        (item: any, index) =>
          item && (
            <UserState
              key={item.publicKey.toString()}
              index={index}
              configs={configs}
              item={item}
              oldAccount={oldAccount}
            />
          )
      )}
    </>
  );
};

export default UserStakings;
