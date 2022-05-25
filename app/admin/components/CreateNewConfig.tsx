import * as anchor from "@project-serum/anchor";
import { Dialog, Transition } from "@headlessui/react";
import {
  AnchorWallet,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { Dispatch, Fragment, SetStateAction, useState } from "react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import toast from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";
import {
  findConfigAuthorityPDA,
  findRewardPotPDA,
  IDL,
  NcStaking,
  PROGRAM_ID,
} from "../sdk";

interface Args {
  rewardMint: PublicKey;
  rewardRate: anchor.BN;
  rewardRateDenominator: anchor.BN;
  minStakingPeriodSec: anchor.BN;
  whitelistedCreator: PublicKey;
}

const createNewConfig = async (
  connection: Connection,
  wallet: AnchorWallet,
  args: Args
) => {
  const {
    rewardRate,
    rewardRateDenominator,
    minStakingPeriodSec,
    rewardMint,
    whitelistedCreator,
  } = args;

  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
  // anchor.setProvider(provider);
  const program = new anchor.Program<NcStaking>(IDL, PROGRAM_ID, provider);

  const config = Keypair.generate();
  console.log("config", config.publicKey.toBase58());
  const [configAuth, configAuthBump] = await findConfigAuthorityPDA(
    config.publicKey
  );
  console.log("configAuth", configAuth.toBase58());

  const [rewardPot] = await findRewardPotPDA(config.publicKey, rewardMint);
  console.log("reward pot", rewardPot.toBase58());

  // init staking config
  const initStakingTx = await program.methods
    .initStakingConfig(configAuthBump, rewardRate, minStakingPeriodSec)
    .accounts({
      admin: wallet.publicKey,
      config: config.publicKey,
      configAuthority: configAuth,
      rewardMint: rewardMint,
      rewardPot: rewardPot,
      // programs
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .signers([config])
    .rpc();
  console.log("init config tx", initStakingTx);

  // console.log("error", error);
  // toast.error("Transaction Error");
  // return new Error("Transaction Error")
};

const CreateNewConfigModal: React.FC<{
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}> = ({ isOpen, setIsOpen }) => {
  const [loading, setLoading] = useState(false);
  const [rewardMint, setRewardMint] = useState<string>();
  const [rewardRate, setRewardRate] = useState<number>();
  const [rewardRateDenominator, setRewardRateDenominator] = useState<number>(1);
  const [minStakingPeriodSec, setMinStakingPeriodSec] = useState<number>();
  const [whitelistedCreator, setWhitelistedCreator] = useState<string>();

  const wallet = useAnchorWallet();
  const { connection } = useConnection();
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
                  Create new staking config
                </Dialog.Title>

                <div className="my-2">
                  <p className="block mb-2 text-sm text-gray-500">Admin:</p>
                  <div className="bg-gray-200 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2">
                    {wallet?.publicKey.toBase58()}
                  </div>
                </div>

                <div className="mb-2">
                  <label
                    htmlFor="reward-mint"
                    className="block mb-2 text-sm text-gray-500"
                  >
                    Reward Mint (spl-token):
                  </label>
                  <input
                    type="text"
                    id="reward-mint"
                    className="bg-gray-200 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                    placeholder="igsvRjB6uyVMGcM9nbWwESxN1eTfVTPiQ1ThoCc8f2g"
                    required
                    value={rewardMint}
                    onChange={(event) => setRewardMint(event.target.value)}
                  />
                </div>

                <div className="mb-2">
                  <label
                    htmlFor="reward-rate"
                    className="block mb-2 text-sm text-gray-500"
                  >
                    Reward rate per second:
                  </label>
                  <input
                    type="number"
                    id="reward-rate"
                    className="bg-gray-200 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                    placeholder="86400"
                    required
                    value={rewardRate}
                    onChange={(event) =>
                      setRewardRate(parseInt(event.target.value, 10))
                    }
                  />
                </div>

                <div className="mb-2">
                  <label
                    htmlFor="reward-rate-denominator"
                    className="block mb-2 text-sm text-gray-500"
                  >
                    Reward rate denominator:
                  </label>
                  <input
                    type="number"
                    id="reward-rate-denominator"
                    className="bg-gray-200 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                    placeholder="1"
                    required
                    value={rewardRateDenominator}
                    onChange={(event) =>
                      setRewardRateDenominator(parseInt(event.target.value, 10))
                    }
                  />
                </div>

                <div className="mb-2">
                  <label
                    htmlFor="mint-staking-period"
                    className="block mb-2 text-sm text-gray-500"
                  >
                    Minimum staking period (sec):
                  </label>
                  <input
                    type="number"
                    id="mint-staking-period"
                    className="bg-gray-200 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                    placeholder="86400"
                    required
                    value={minStakingPeriodSec}
                    onChange={(event) =>
                      setMinStakingPeriodSec(parseInt(event.target.value, 10))
                    }
                  />
                </div>

                <div className="mb-2">
                  <label
                    htmlFor="creator-address"
                    className="block mb-2 text-sm text-gray-500"
                  >
                    NFT collection creator address as whitelist:
                  </label>
                  <input
                    type="text"
                    id="creator-address"
                    className="bg-gray-200 border text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                    placeholder="BWWE1mrYNCZ2rapGiWhrURgqq9P2RHVCHnAeVHRoFsZv"
                    required
                    value={whitelistedCreator}
                    onChange={(event) =>
                      setWhitelistedCreator(event.target.value)
                    }
                  />
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-progress"
                    onClick={async () => {
                      if (!wallet) {
                        return toast.error("Wallet not connected");
                      }
                      if (!rewardMint) {
                        return toast.error("Invalid rewardMint");
                      }
                      try {
                        new PublicKey(rewardMint!);
                      } catch (error) {
                        return toast.error("Invalid rewardMint");
                      }

                      if (!rewardRate) {
                        return toast.error("Invalid rewardRate");
                      }
                      if (!rewardRateDenominator) {
                        return toast.error("Invalid rewardRateDenominator");
                      }
                      if (!minStakingPeriodSec) {
                        return toast.error("Invalid minStakingPeriodSec");
                      }
                      if (!whitelistedCreator) {
                        return toast.error("Invalid whitelistedCreator");
                      }
                      try {
                        new PublicKey(whitelistedCreator!);
                      } catch (error) {
                        return toast.error("Invalid whitelistedCreator");
                      }

                      const createNewConfigTx = new Promise(
                        async (resolve, reject) => {
                          setLoading(true);
                          try {
                            await createNewConfig(connection, wallet!, {
                              rewardMint: new PublicKey(rewardMint!),
                              rewardRate: new anchor.BN(rewardRate!),
                              rewardRateDenominator: new anchor.BN(
                                rewardRateDenominator!
                              ),
                              minStakingPeriodSec: new anchor.BN(
                                minStakingPeriodSec!
                              ),
                              whitelistedCreator: new PublicKey(
                                whitelistedCreator!
                              ),
                            });
                            closeModal();
                            resolve(1);
                          } catch (error) {
                            console.error(error);
                            reject();
                          } finally {
                            setLoading(false);
                          }
                        }
                      );

                      toast.promise(createNewConfigTx, {
                        loading: "Processing transaction...",
                        success: <b>Config created!</b>,
                        error: <b>Transaction error</b>,
                      });
                    }}
                    disabled={loading}
                  >
                    {loading ? <LoadingSpinner /> : "Create new config"}
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

export default CreateNewConfigModal;
