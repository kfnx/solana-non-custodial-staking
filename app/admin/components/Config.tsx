import { ProgramAccount } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { useState } from "react";
import useGlobalStore from "../hooks/useGlobalStore";
import { StakingConfig } from "../sdk/accounts";
import { getTokenBalanceByATA } from "../sdk/user";
import { convertSecondsToReadableTime } from "../utils/convertSecToReadableTime";
import { giveCommas } from "../utils/giveCommas";

const Config: React.FC<{
  config: ProgramAccount<StakingConfig>;
  index: number;
}> = ({ config, index }) => {
  const [balance, setBalance] = useState<string>();
  const connection = useGlobalStore((state) => state.connection);
  const fetchBalance = async (ATA: PublicKey) => {
    const tokenBalance = await getTokenBalanceByATA(connection, ATA);
    const tokenBalanceWithCommas = giveCommas(tokenBalance);
    setBalance(tokenBalanceWithCommas);
  };

  return (
    <div className="text-xs mt-4">
      <div className="flex w-full justify-between my-0.5">
        <span className="py-0.5 px-2 mr-2 border rounded-md text-slate-600 dark:text-gray-200">
          {index + 1}
        </span>
        <span>
          <button
            onClick={() => fetchBalance(config.account.rewardPot)}
            className="py-0.5 px-2 mr-2 border rounded-md text-slate-600 dark:text-gray-200"
          >
            check reward balance
          </button>{" "}
          {balance}
        </span>
      </div>
      <div className="flex flex-column flex-wrap mt-2">
        <div className="flex w-full justify-between my-0.5 bg-slate-200 dark:bg-slate-500/75">
          <span>PDA</span>
          <span>{config.publicKey.toString()}</span>
        </div>
        <div className="flex w-full justify-between my-0.5">
          <span>admin</span>
          <span>{config.account.admin.toString()}</span>
        </div>
        <div className="flex w-full justify-between my-0.5 bg-slate-200 dark:bg-slate-500/75">
          <span>rewardPot</span>
          <span>{config.account.rewardPot.toString()}</span>
        </div>
        <div className="flex w-full justify-between my-0.5">
          <span>rewardMint</span>
          <span>{config.account.rewardMint.toString()}</span>
        </div>
        <div className="flex w-full justify-between my-0.5 bg-slate-200 dark:bg-slate-500/75">
          <span>configAuthority</span>
          <span>{config.account.configAuthority.toString()}</span>
        </div>
        <div className="flex w-full justify-between my-0.5">
          <span>configAuthoritySeed</span>
          <span>{config.account.configAuthoritySeed.toString()}</span>
        </div>
        <div className="flex w-full justify-between my-0.5 bg-slate-200 dark:bg-slate-500/75">
          <span>configAuthorityBumpSeed</span>
          <span>{config.account.configAuthorityBumpSeed.toString()}</span>
        </div>
        <div className="flex w-full justify-between my-0.5">
          <span>rewardPerSec</span>
          <span>{config.account.rewardPerSec.toString()}</span>
        </div>
        <div className="flex w-full justify-between my-0.5 bg-slate-200 dark:bg-slate-500/75">
          <span>rewardDenominator</span>
          <span>{config.account.rewardDenominator.toString()}</span>
        </div>
        <div className="flex w-full justify-between my-0.5">
          <span>reward (simulated)</span>
          <span>
            per sec:{" "}
            {Number(config.account.rewardPerSec.toString()) /
              Number(config.account.rewardDenominator.toString())}{" "}
            | daily:{" "}
            {(Number(config.account.rewardPerSec.toString()) /
              Number(config.account.rewardDenominator.toString())) *
              86_400}
          </span>
        </div>
        <div className="flex w-full justify-between my-0.5 bg-slate-200 dark:bg-slate-500/75">
          <span>reward config</span>
          <span>
            base: {config.account.rewardPerSec.toString()} | denominator:{" "}
            {config.account.rewardDenominator.toString()}
          </span>
        </div>
        <div className="flex w-full justify-between my-0.5">
          <span>stakingLockedDurationInSec </span>
          <span>
            {`${config.account.stakingLockDurationInSec.toString()} seconds or 
            ${
              convertSecondsToReadableTime(
                Number(config.account.stakingLockDurationInSec.toString())
              ) || " Flexible"
            }`}
          </span>
        </div>
        <div className="flex w-full justify-between my-0.5 bg-slate-200 dark:bg-slate-500/75">
          <span>rewardAccrued</span>
          <span>{config.account.rewardAccrued.toString()}</span>
        </div>
        <div className="flex w-full justify-between my-0.5">
          <span>nftsStaked</span>
          <span>{config.account.nftsStaked.toString()}</span>
        </div>
        <div className="flex w-full justify-between my-0.5 bg-slate-200 dark:bg-slate-500/75">
          <span>initiatedUsers</span>
          <span>{config.account.initiatedUsers.toString()}</span>
        </div>
        <div className="flex w-full justify-between my-0.5">
          <span>activeStakers</span>
          <span>{config.account.activeStakers.toString()}</span>
        </div>
        <div className="flex w-full justify-between my-0.5 bg-slate-200 dark:bg-slate-500/75">
          <span>whitelistedCreator</span>
          <span>{config.account.creatorWhitelist.toString()}</span>
        </div>
      </div>
    </div>
  );
};

const Configs: React.FC<{ configs: ProgramAccount<StakingConfig>[] }> = ({
  configs,
}) => {
  if (configs.length > 0) {
    return (
      <>
        {configs.map((item, index) => (
          <Config key={item.publicKey.toString()} config={item} index={index} />
        ))}
      </>
    );
  }
  return <p>No config found</p>;
};

export default Configs;
