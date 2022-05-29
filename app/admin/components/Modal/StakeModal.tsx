import { Dialog, Transition } from "@headlessui/react";
import { Dispatch, Fragment, SetStateAction, useEffect, useState } from "react";
import LoadingSpinner from "../LoadingSpinner";
import useGlobalStore from "../../hooks/useGlobalStore";
import ConfigSelector from "../ConfigSelector";
import UserNFT from "../UserNFT";
import { PublicKey } from "@solana/web3.js";

const StakeModal: React.FC<{
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}> = ({ isOpen, setIsOpen }) => {
  const [loading, setLoading] = useState(false);
  // const [selectedNFT, setSelectedNFT] = useState<string[]>([]);
  const selectedNFT = useGlobalStore((state) => state.selectedNFT);
  const selectNFT = useGlobalStore((state) => state.selectNFT);
  const stake = useGlobalStore((state) => state.stake);
  const wallet = useGlobalStore((state) => state.wallet);

  const handleSelectNFT = (mint: PublicKey) => {
    console.log("selectedNFT", selectedNFT);
    if (mint.toBase58() === selectedNFT?.toBase58()) {
      return selectNFT(undefined);
    }
    return selectNFT(mint);
    // if (selectedNFT.includes(mint)) {
    //   setSelectedNFT((nfts) => nfts.filter((mint) => mint !== mint));
    // } else {
    //   setSelectedNFT((nfts) => [...nfts, mint]);
    // }
  };
  const closeModal = () => setIsOpen(false);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Stake
                </Dialog.Title>

                <div className="my-6">
                  <div className="my-2">
                    <label
                      htmlFor="creator-address"
                      className="block mb-2 text-sm text-gray-500"
                    >
                      Config:
                    </label>

                    <ConfigSelector />
                  </div>

                  <div className="my-2">
                    <p className="block mb-2 text-sm text-gray-500">
                      User (connected wallet):
                    </p>
                    <div className="bg-gray-200 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 hover:cursor-not-allowed">
                      {wallet?.publicKey.toBase58()}
                    </div>
                  </div>

                  <div className="my-2">
                    <p className="block mb-2 text-sm text-gray-500">
                      Select NFT to stake:
                    </p>
                    <UserNFT selected={selectedNFT} select={handleSelectNFT} />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-progress"
                    onClick={() =>
                      stake({
                        onStart: () => setLoading(true),
                        onSuccess: () => closeModal(),
                        onFinish: () => setLoading(false),
                      })
                    }
                    disabled={loading}
                  >
                    {loading ? <LoadingSpinner /> : "Stake"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default StakeModal;
