import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, SelectorIcon, TerminalIcon } from "@heroicons/react/solid";
import useGlobalState from "../hooks/useGlobalState";

export default function ConfigSelector() {
  const configs = useGlobalState((state) => state.configs);
  const config = useGlobalState((state) => state.config);
  const setConfig = useGlobalState((state) => state.setConfig);

  return (
    <Listbox value={config} onChange={setConfig}>
      <div className="relative my-2 shadow rounded-md">
        <Listbox.Button className="relative w-full cursor-default rounded-md bg-blue-900/20 hover:opacity-90 text-slate-600 py-2.5 pl-3 pr-10 text-left focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm hover:cursor-pointer">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
            <TerminalIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="block truncate ml-7">
            {configs.length > 0
              ? configs[config].publicKey.toBase58()
              : "No config found"}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <SelectorIcon className="h-5 w-5" aria-hidden="true" />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {configs.map((item, index) => (
              <Listbox.Option
                key={item.publicKey.toBase58()}
                className={({ active }) =>
                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                    active ? "bg-violet-100 text-violet-900" : "text-gray-900"
                  }`
                }
                value={index}
              >
                {({ selected }) => (
                  <>
                    <span
                      className={`block truncate ${
                        selected ? "font-medium" : "font-normal"
                      }`}
                    >
                      {item.publicKey.toBase58()}
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
