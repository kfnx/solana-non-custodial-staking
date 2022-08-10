import { PublicKey } from "@solana/web3.js";
import { useEffect } from "react";
import useGlobalStore from "../hooks/useGlobalStore";
import { findUserStatePDA } from "../sdk/pda";
import { convertSecondsToReadableTime } from "../utils/convertSecToReadableTime";
import { unixTimeConverter } from "../utils/unixTimeConverter";

function readLockTime(configs: any[], configId: PublicKey) {
  const config = configs.find(
    (config) => config.publicKey.toString() === configId
  );
  return (
    convertSecondsToReadableTime(
      Number(config.account.stakingLockDurationInSec.toString())
    ) || " Flexible"
  );
}

const UserState: React.FC<{ index: number; configs: any[]; item: any }> = ({
  index,
  configs,
  item,
}) => {
  const currentPDA = item.publicKey;
  const userId = item.account["user"];
  const config = item.account["config"];

  // @ts-ignore
  useEffect(async () => {
    const [v1] = await findUserStatePDA(userId, config);
    const isV1 = currentPDA.toString() === v1.toString();
    const tss = item.account["time_staking_start"];

    console.log(userId.toString(), currentPDA.toString(), tss, item.account);
  });

  return (
    <div className="text-xs mt-4">
      <span className="py-0.5 px-2 mr-2 border rounded-md text-slate-600 dark:text-gray-200">
        {index + 1}
      </span>
      <div className="flex flex-column flex-wrap mt-2">
        <div className="flex w-full justify-between my-0.5">
          <span>Lock Duration</span>
          <span>
            {readLockTime(configs, item.account["config"].toString())}
          </span>
        </div>
        <div className="flex w-full justify-between my-0.5 bg-slate-200 dark:bg-slate-500/75">
          <span>PDA</span>
          <span>{item.publicKey.toString()}</span>
        </div>
        {Object.keys(item.account).map((v, id) => {
          const className = `flex w-full justify-between my-0.5${
            id % 2 ? " bg-slate-200 dark:bg-slate-500/75" : ""
          }`;

          if (v === "timeLastClaim" || v === "timeLastStake") {
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
  );
};

const UserStakings: React.FC<{ stakings: any[] }> = ({ stakings }) => {
  const configs = useGlobalStore((state) => state.configs);

  if (stakings.length === 0) {
    return <span>No initiated staking found</span>;
  }

  return (
    <>
      {stakings.map((item: any, index) => (
        <UserState
          key={item.publicKey.toString()}
          index={index}
          configs={configs}
          item={item}
        />
      ))}
    </>
  );
};

export default UserStakings;