import { FC } from "react";
import Image from "next/image";
import { CheckIcon, LockClosedIcon } from "@heroicons/react/solid";
import { PublicKey } from "@solana/web3.js";
import useWalletNFT from "../hooks/useWalletNFT";

const NFTImage: FC<{ src: string; alt: string }> = ({ src, alt }) => {
  if (src) {
    return (
      <Image src={src} alt={alt} width={128} height={128} layout="fixed" />
    );
  }
  return <div className="w-32 h-32 bg-yellow" />;
};

const MyNFTCard: FC<{ nft: INFT; onClick?: any; selected?: boolean }> = ({
  nft,
  onClick,
  selected,
}) => {
  // const index = nft.externalMetadata.name.replace(/.*#/, "");
  const isFrozen = nft.state === "frozen";

  return (
    <div
      className="relative flex flex-col items-center border p-4 hover:bg-black/20 cursor-pointer rounded-md"
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
      />
      <div className="flex justify-between mt-3 text-sm">
        <p>{nft.externalMetadata.name}</p>
      </div>
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

const UserNFT: React.FC<{
  selected: undefined | PublicKey;
  select?: Function;
}> = ({ select = [], selected }) => {
  const { isLoading, isEmpty, nfts } = useWalletNFT();

  if (isLoading) {
    return <p className="py-4 text-lg">Loading NFTs..</p>;
  }

  if (isEmpty) {
    return <p className="py-4 text-lg">Empty</p>;
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {nfts.map((nft) => (
        <MyNFTCard
          key={nft.mint.toString()}
          nft={nft}
          selected={selected?.toBase58() === nft.mint.toString()}
          onClick={select}
        />
      ))}
    </div>
  );
};

export default UserNFT;
