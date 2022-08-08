import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { getNFTsByOwner } from "../utils/getNFT";

const useWalletNfts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [nfts, setNfts] = useState<INFT[]>([]);

  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const refetchNFT = useCallback(async () => {
    if (!wallet) {
      return;
    }
    setIsLoading(true);
    const nftsForOwner = await getNFTsByOwner(wallet.publicKey, connection);
    setNfts(nftsForOwner);
    setIsLoading(false);
  }, [wallet, connection]);

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

  return { isLoading, isEmpty, nfts, refetchNFT };
};

export default useWalletNfts;
