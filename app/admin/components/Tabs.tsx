import { useState } from "react";
import { Tab } from "@headlessui/react";
import Admin from "./Admin";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import User from "./User";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const Stats = () => (
  <div>
    <h2>stats here</h2>
    <p>bla bla</p>
  </div>
);

const categories = {
  Admin: <Admin />,
  User: <User />,
  Stats: <Stats />,
};

export default function Tabs() {
  const wallet = useAnchorWallet();

  return (
    <div className="w-full max-w-md px-2 py-16 sm:px-0">
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          {Object.keys(categories).map((category) => (
            <Tab
              key={category}
              className={({ selected }) =>
                classNames(
                  "w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700",
                  "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
                  selected
                    ? "bg-white shadow"
                    : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                )
              }
            >
              {category}
            </Tab>
          ))}
        </Tab.List>
        {!wallet?.publicKey ? (
          <div className="text-center py-4">Connect wallet to get started</div>
        ) : (
          <Tab.Panels className="mt-2">
            {Object.values(categories).map((content, idx) => (
              <Tab.Panel
                key={idx}
                className={classNames(
                  "rounded-xl bg-white p-3",
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
