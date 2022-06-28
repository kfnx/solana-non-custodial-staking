import { FC } from "react";
import Image from "next/image";
import { CheckIcon, LockClosedIcon } from "@heroicons/react/solid";
import { PublicKey } from "@solana/web3.js";
import useWalletNFT from "../hooks/useWalletNFT";

const NFTImage: FC<{ src: string; alt: string; size: number }> = ({
  src,
  alt,
  size,
}) => {
  if (src) {
    return (
      <Image src={src} alt={alt} width={size} height={size} layout="fixed" />
    );
  }
  return <div className={`w-[${size}px] h-[${size}px] bg-slate-500`} />;
};

const NFTCard: FC<{
  nft: INFT;
  onClick?: any;
  selected?: boolean;
  size: number;
}> = ({ nft, onClick, selected, size }) => {
  // const index = nft.externalMetadata.name.replace(/.*#/, "");
  const isFrozen = nft.state === "frozen";

  return (
    <div
      className="relative flex flex-col items-center border p-1.5 hover:bg-black/20 cursor-pointer rounded-md"
      onClick={() => {
        if (typeof onClick === "function") {
          // if (isFrozen) {
          //   toast.error(
          //     `Cannot stake ${nft.externalMetadata.name} because it is staked`
          //   );
          //   return;
          // }
          return onClick(nft.mint);
        }
      }}
    >
      <NFTImage
        src={nft.externalMetadata.image}
        alt={nft.externalMetadata.name}
        size={size}
      />
      <small>{nft.externalMetadata.name}</small>
      {isFrozen && (
        <span className="absolute top-2 left-2 flex items-center text-blue-900">
          <LockClosedIcon className="h-8 w-8" aria-hidden="true" />
        </span>
      )}
      {selected && (
        <span className="absolute top-2 right-2 flex items-center text-blue-900">
          <CheckIcon className="h-8 w-8" aria-hidden="true" />
        </span>
      )}
    </div>
  );
};

const UserNFTs: React.FC<{
  selected?: undefined | PublicKey;
  select?: Function;
  staked?: boolean;
  unstaked?: boolean;
  cardSize?: number;
}> = ({
  select = [],
  selected,
  staked = false,
  unstaked = false,
  cardSize = 128,
}) => {
  const { isLoading, isEmpty, nfts } = useWalletNFT();

  if (isLoading) {
    return <p className="py-4 text-lg">Loading NFTs..</p>;
  }

  if (isEmpty) {
    return (
      <p className="py-4 text-lg">Empty (NFT filtered by creator addres)</p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {nfts
        .filter((nft) => {
          if (unstaked) {
            return nft.state === "initialized";
          }
          if (staked) {
            return nft.state === "frozen";
          }
          return true;
        })
        .map((nft) => (
          <NFTCard
            key={nft.mint.toString()}
            size={cardSize}
            nft={nft}
            selected={selected?.toBase58() === nft.mint.toString()}
            onClick={select}
          />
        ))}
    </div>
  );
};

export default UserNFTs;
