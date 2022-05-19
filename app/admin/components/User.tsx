import * as anchor from "@project-serum/anchor";
import {
  AnchorWallet,
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { IDL, NcStaking, PROGRAM_ID } from "../sdk";

const getAllConfig = async (connection: Connection, wallet: AnchorWallet) => {
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
  anchor.setProvider(provider);
  const program = new anchor.Program<NcStaking>(IDL, PROGRAM_ID, provider);
  return await program.account.user.all();
};

export default function User() {
  const [data, setData] = useState<any>([]);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  
  useEffect(() => {
    (async () => {
      if (wallet) {
        const configs = await getAllConfig(connection, wallet);
        setData(configs);
      }
    })();
  }, [connection, wallet]);

  return (
    <div>
      <h2>Modify Configs here</h2>
      <h2>Available config:</h2>
      {data.length === 0 ? (
        "No config founds"
      ) : (
        <small>{JSON.stringify(data, null, 2)}</small>
      )}
    </div>
  );
}
