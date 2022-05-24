import * as anchor from "@project-serum/anchor";
import {
  AnchorWallet,
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { IDL, NcStaking, PROGRAM_ID } from "../sdk";

const getAllUsers = async (connection: Connection, wallet: AnchorWallet) => {
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
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
        const users = await getAllUsers(connection, wallet);
        setData(users);
      }
    })();
  }, [connection, wallet]);

  return (
    <div>
      <h2>User do interact here</h2>
      <h2>initiated users:</h2>
      {data.length === 0 ? (
        "No config founds"
      ) : (
        <small>{JSON.stringify(data, null, 2)}</small>
      )}
    </div>
  );
}
