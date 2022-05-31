import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { getNFTsByOwner } from "../utils/getNFT";

const useWalletNfts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const [nfts, setNfts] = useState<INFT[]>([]);

  useEffect(() => {
    if (!wallet) {
      return;
    }

    let cancel = false;
    const fetchNFT = async (publicKey: PublicKey) => {
      if (!cancel) {
        setIsLoading(true);
        const nftsForOwner = await getNFTsByOwner(publicKey, connection);
        setNfts(nftsForOwner);
        setIsLoading(false);
      }
    };

    fetchNFT(wallet.publicKey);

    return () => {
      cancel = true;
    };
  }, [connection, wallet]);

  const isEmpty = nfts.length === 0;

  return { isLoading, isEmpty, nfts };
};

export default useWalletNfts;
