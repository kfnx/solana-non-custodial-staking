import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, SelectorIcon, GlobeAltIcon } from "@heroicons/react/solid";
import useGlobalStore, { networks } from "../hooks/useGlobalStore";

export default function NetworkSelector() {
  const network = useGlobalStore((state) => state.network);
  const setNetwork = useGlobalStore((state) => state.setNetwork);

  return (
    <Listbox value={network} onChange={setNetwork}>
      <div className="relative">
        <Listbox.Button className="relative w-44 h-12 cursor-default shadow rounded bg-blue-900/20 text-slate-600 dark:text-gray-200 font-bold hover:opacity-90 py-2 pl-3 pr-10 text-left focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm hover:cursor-pointer">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
            <GlobeAltIcon
              className="h-5 w-5 text-slate-600 dark:text-gray-200"
              aria-hidden="true"
            />
          </span>
          <span className="block truncate ml-7">{network.name}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <SelectorIcon
              className="h-5 w-5 text-slate-600 dark:text-gray-200"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {networks.map((network, networkIdx) => (
              <Listbox.Option
                key={networkIdx}
                className={({ active }) =>
                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                    active ? "bg-violet-100 text-violet-900" : "text-gray-900"
                  }`
                }
                value={network}
              >
                {({ selected }) => (
                  <>
                    <span
                      className={`block truncate ${
                        selected ? "font-medium" : "font-normal"
                      }`}
                    >
                      {network.name}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-violet-300">
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}
