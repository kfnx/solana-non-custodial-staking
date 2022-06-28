import { unixTimeConverter } from "../utils/unixTimeConverter";

const UserStakings: React.FC<{ stakings: any[] }> = ({ stakings }) => {
  if (stakings.length === 0) {
    return <span>No initiated staking found</span>;
  }

  return (
    <>
      {stakings.map((item: any, index) => (
        <div key={item.publicKey.toString()} className="text-xs mt-4">
          <span className="py-0.5 px-2 mr-2 border rounded-md text-slate-600 dark:text-gray-200">
            {index + 1}
          </span>
          <div className="flex flex-column flex-wrap mt-2">
            <div className="flex w-full justify-between my-0.5 bg-slate-200 dark:bg-slate-500/75">
              <span>PDA</span>
              <span>{item.publicKey.toString()}</span>
            </div>
            {Object.keys(item.account).map((v, id) => {
              const className = `flex w-full justify-between my-0.5${
                id % 2 ? " bg-slate-200 dark: bg-slate-500/75" : ""
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
      ))}
    </>
  );
};

export default UserStakings;
