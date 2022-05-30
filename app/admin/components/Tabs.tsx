import { useEffect } from "react";
import { Tab } from "@headlessui/react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import useGlobalStore from "../hooks/useGlobalStore";
import Admin from "./Admin";
import User from "./User";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const categories = {
  "as Admin": <Admin />,
  "as User": <User />,
  // "Utility": <Utility />, // example: create NFT, create mint token, etc
};

export default function Tabs() {
  const anchorWallet = useAnchorWallet();
  const setWallet = useGlobalStore((state) => state.setWallet);
  const wallet = useGlobalStore((state) => state.wallet);

  useEffect(() => {
    if (anchorWallet?.publicKey) {
      setWallet(anchorWallet);
    }
  }, [anchorWallet, setWallet]);

  return (
    <div className="w-full max-w-lg py-2 sm:px-0">
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          {Object.keys(categories).map((category) => (
            <Tab
              key={category}
              className={({ selected }) =>
                classNames(
                  "w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 dark:text-blue-200",
                  "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                  selected
                    ? "bg-white dark:bg-gray-600 shadow"
                    : "text-blue-100 dark:text-blue-600/50 hover:bg-white/[0.12] hover:text-white"
                )
              }
            >
              {category}
            </Tab>
          ))}
        </Tab.List>
        {!wallet ? (
          <div className="text-center py-4">Connect wallet to get started</div>
        ) : (
          <Tab.Panels className="mt-2">
            {Object.values(categories).map((content, idx) => (
              <Tab.Panel
                key={idx}
                className={classNames(
                  "rounded-xl bg-white dark:bg-gray-600 p-3",
                  "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2"
                )}
              >
                {content}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        )}
      </Tab.Group>
    </div>
  );
}
