import { assert } from "chai";
import * as anchor from "@project-serum/anchor";
import { NcStaking } from "../target/types/nc_staking";
import { airdropUser, createUser, User, userToken } from "./utils/user";
import { findVaultPDA } from "./utils/pda";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";

describe("Claiming staking token reward", () => {
  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
  const connection = new Connection(clusterApiUrl("devnet"));
  console.log(connection.rpcEndpoint);

  const sender = createUser(
    connection,
    Keypair.fromSecretKey(
      new Uint8Array([
        46, 153, 255, 163, 58, 223, 86, 187, 209, 167, 46, 176, 18, 225, 156,
        176, 71, 14, 67, 109, 146, 108, 110, 61, 230, 47, 140, 147, 96, 222,
        171, 222, 87, 30, 67, 166, 139, 42, 111, 149, 250, 38, 72, 195, 127,
        111, 117, 250, 132, 207, 86, 106, 250, 33, 178, 119, 200, 158, 134, 82,
        70, 103, 165, 27,
      ])
    )
  );

  const receiver = createUser(
    connection,
    Keypair.fromSecretKey(
      new Uint8Array([
        237, 68, 70, 100, 178, 143, 172, 67, 218, 134, 205, 51, 24, 192, 68,
        164, 207, 117, 236, 158, 133, 117, 34, 15, 214, 239, 11, 241, 63, 192,
        53, 129, 222, 8, 61, 199, 118, 117, 45, 175, 38, 169, 11, 74, 6, 127,
        129, 160, 53, 32, 137, 92, 97, 3, 235, 107, 225, 166, 202, 17, 180, 33,
        178, 232,
      ])
    )
  );

  describe("claim test", () => {
    it("claim test", async () => {
      const tokenMint = new PublicKey(
        "mEEkFWjX99DYCpRwAUVuY48q4WiBPvAYJqmUgp4teKM"
      );
      const [senderTokenAccount, senderTokenBalance] = await userToken(
        connection,
        sender.wallet.publicKey,
        tokenMint
      );
      console.log("sender", sender.keypair.publicKey.toBase58());
      console.log("senderTokenAccount", senderTokenAccount.toBase58());
      console.log("senderTokenBalance", senderTokenBalance);

      const [receiverTokenAccount, receiverTokenBalance] = await userToken(
        connection,
        receiver.wallet.publicKey,
        tokenMint
      );
      console.log("receiver", receiver.keypair.publicKey.toBase58());
      console.log("receiverTokenAccount", receiverTokenAccount.toBase58());
      console.log("receiverTokenBalance", receiverTokenBalance);

      await program.methods
        .claim()
        .accounts({
          user: sender.wallet.publicKey,
          rewardFromAta: senderTokenAccount,
          rewardToAta: receiverTokenAccount,

          // programs
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([sender.keypair])
        .rpc();
    });
  });
});
