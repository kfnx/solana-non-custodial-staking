import { Dispatch, FC, SetStateAction } from "react";
import Image from "next/image";
import useWalletNFT from "../hooks/useWalletNFT";
import { CheckIcon } from "@heroicons/react/solid";

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

  return (
    <div
      className="relative flex flex-col items-center border p-4 hover:bg-black/20 cursor-pointer rounded-md"
      onClick={() =>
        typeof onClick === "function" ? onClick(nft.mint.toString()) : null
      }
    >
      <NFTImage
        src={nft.externalMetadata.image}
        alt={nft.externalMetadata.name}
      />
      <div className="flex justify-between mt-3 text-sm">
        <p>{nft.externalMetadata.name}</p>
      </div>
      {selected ? (
        <span className="absolute top-2 right-2 flex items-center text-blue-900">
          <CheckIcon className="h-8 w-8" aria-hidden="true" />
        </span>
      ) : null}
    </div>
  );
};

const UserNFT: React.FC<{
  selected: string[];
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
          selected={selected.includes(nft.mint.toString())}
          onClick={select}
        />
      ))}
    </div>
  );
};

export default UserNFT;
