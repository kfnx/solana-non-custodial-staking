import * as anchor from "@project-serum/anchor";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  ParsedAccountData,
  PublicKey,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
  transfer,
} from "@solana/spl-token";
import { assert } from "chai";
import { createUser, programForUser, User } from "./utils/user";
import { METADATA_PROGRAM_ID } from "./utils/program-id";
import { findDelegateAuthPDA } from "./utils/pda";
import { NcStaking } from "../target/types/nc_staking";

const connection = new Connection(clusterApiUrl("devnet"));
const provider = new anchor.AnchorProvider(
  connection,
  anchor.AnchorProvider.local().wallet,
  {
    commitment: "confirmed",
  }
);
const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;

let justin: User;
const justinNFT = {
  mint: new PublicKey("AiFWNmitWNXQr3EazPDJWcAfEvU8KnPf69WAS6F6iFG7"),
  tokenAccount: new PublicKey("BE9eZ6WSzKekD4pEgkoi3vud1BN1SjgrfsEe8DMQr5Hs"),
  edition: new PublicKey("3Bff77s3HqbDa8WEcneMRF1NeUPhHVBPdFYd5g1upuRo"),
};

let markers: User;
// markers dont own NFT at first
const markersNFT = {
  tokenAccount: new PublicKey("FdTMiWD7FAXhNmewHUSahAok896mtJfDRuSR4u1LsNsm"),
};

before((done) => {
  console.log("rpc endpoint", provider.connection.rpcEndpoint);
  console.log("program id", program.programId.toBase58());

  // create user: Justin as NFT Owner UETQgtvJWRcMsqEqHtEBGyHHzDtebar3eWE79g4y2H6
  createUser(
    provider,
    Keypair.fromSecretKey(
      Uint8Array.from([
        244, 32, 132, 254, 83, 48, 171, 241, 44, 221, 83, 7, 75, 133, 215, 247,
        83, 92, 156, 200, 48, 72, 176, 40, 54, 66, 179, 214, 38, 205, 143, 232,
        6, 249, 229, 84, 133, 153, 217, 45, 254, 55, 54, 162, 255, 149, 236,
        197, 218, 61, 204, 190, 153, 121, 136, 76, 84, 109, 230, 51, 167, 123,
        224, 25,
      ])
    )
  ).then((user) => {
    justin = user;

    // create user: Markers as Villain NFT exploiter tSTW5PWzjDYCjeYEqpZg92PyRv7R733YPx9Diz6BUWr
    createUser(
      provider,
      Keypair.fromSecretKey(
        Uint8Array.from([
          206, 215, 218, 86, 77, 204, 200, 3, 111, 91, 3, 5, 115, 142, 94, 232,
          178, 52, 125, 100, 97, 2, 219, 114, 212, 31, 160, 213, 89, 216, 92,
          116, 13, 45, 103, 206, 98, 224, 169, 15, 32, 116, 107, 194, 63, 241,
          33, 247, 230, 251, 1, 145, 140, 73, 115, 124, 212, 106, 229, 74, 133,
          109, 173, 79,
        ])
      )
    ).then((user) => {
      markers = user;

      done();
    });
  });
});

describe("Staking Unstaking lifecyle", () => {
  it("Users", () => {
    console.log("  Justin", justin.keypair.publicKey.toBase58());
    console.log("  Justin NFT mint", justinNFT.mint.toBase58());
    console.log("  Justin NFT token acc", justinNFT.tokenAccount.toBase58());
    console.log("  Markers", markers.keypair.publicKey.toBase58());
  });

  it("Markers should not be able to stake/freeze Justin NFT", async () => {
    const [delegateAuth] = await findDelegateAuthPDA(
      justinNFT.tokenAccount,
      program.programId
    );
    const markersCall = programForUser(program, markers);

    try {
      await markersCall.methods
        .freeze()
        .accounts({
          user: markers.wallet.publicKey,
          tokenAccount: justinNFT.tokenAccount,
          delegateAuth,
          tokenProgram: TOKEN_PROGRAM_ID,
          mint: justinNFT.mint,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          edition: justinNFT.edition,
        })
        .rpc();
    } catch (error) {
      assert.equal(
        error.message,
        "AnchorError caused by account: token_account. Error Code: ConstraintRaw. Error Number: 2003. Error Message: A raw constraint was violated."
      );
      return;
    }
  });

  it("Markers should not be able to stake/freeze Justin NFT even if he use Justin address", async () => {
    const [delegateAuth] = await findDelegateAuthPDA(
      justinNFT.tokenAccount,
      program.programId
    );
    const markersCall = programForUser(program, markers);

    try {
      await markersCall.methods
        .freeze()
        .accounts({
          user: justin.wallet.publicKey,
          tokenAccount: justinNFT.tokenAccount,
          delegateAuth,
          tokenProgram: TOKEN_PROGRAM_ID,
          mint: justinNFT.mint,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          edition: justinNFT.edition,
        })
        .rpc();
    } catch (error) {
      assert.equal(error.message, "Signature verification failed");
      return;
    }
  });

  it("Justin can stake/freeze his own NFT", async () => {
    const [delegateAuth] = await findDelegateAuthPDA(
      justinNFT.tokenAccount,
      program.programId
    );
    const justinCall = programForUser(program, justin);

    const tx = await justinCall.methods
      .freeze()
      .accounts({
        user: justin.wallet.publicKey,
        tokenAccount: justinNFT.tokenAccount,
        delegateAuth,
        tokenProgram: TOKEN_PROGRAM_ID,
        mint: justinNFT.mint,
        tokenMetadataProgram: METADATA_PROGRAM_ID,
        edition: justinNFT.edition,
      })
      .rpc();

    console.log("  Freeze transaction signature", tx);
    const ataInfo = await connection.getParsedAccountInfo(
      justinNFT.tokenAccount
    );
    const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
    assert.equal(parsed.info.state, "frozen");
  });

  it("Justin cannot transfer his NFT if its staked (freze)", async () => {
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      justin.wallet.payer,
      justinNFT.mint,
      markers.wallet.publicKey
    );

    try {
      await transfer(
        connection,
        justin.wallet.payer,
        justinNFT.tokenAccount,
        toTokenAccount.address,
        justin.wallet.publicKey,
        1
      );
    } catch (error) {
      assert.equal(
        error.message,
        "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x11"
      ); // frozen
      return;
    }

    assert.fail("The instruction should have failed with a frozen account.");
  });

  it("Markers cannot unstake/thaw Justin NFT", async () => {
    const [delegateAuth] = await findDelegateAuthPDA(
      justinNFT.tokenAccount,
      program.programId
    );
    const markersCall = programForUser(program, markers);

    try {
      await markersCall.methods
        .freeze()
        .accounts({
          user: markers.wallet.publicKey,
          tokenAccount: justinNFT.tokenAccount,
          delegateAuth,
          tokenProgram: TOKEN_PROGRAM_ID,
          mint: justinNFT.mint,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          edition: justinNFT.edition,
        })
        .rpc();
    } catch (error) {
      assert.equal(
        error.message,
        "AnchorError caused by account: token_account. Error Code: ConstraintRaw. Error Number: 2003. Error Message: A raw constraint was violated."
      );
      return;
    }
  });

  it("Markers cannot unstake/thaw Justin NFT even if he use Justin address", async () => {
    const [delegateAuth] = await findDelegateAuthPDA(
      justinNFT.tokenAccount,
      program.programId
    );
    const markersCall = programForUser(program, markers);

    try {
      await markersCall.methods
        .freeze()
        .accounts({
          user: justin.wallet.publicKey,
          tokenAccount: justinNFT.tokenAccount,
          delegateAuth,
          tokenProgram: TOKEN_PROGRAM_ID,
          mint: justinNFT.mint,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          edition: justinNFT.edition,
        })
        .rpc();
    } catch (error) {
      assert.equal(error.message, "Signature verification failed");
      return;
    }
  });

  it("Justin can unstake/thaw his own NFT", async () => {
    const [delegateAuth] = await findDelegateAuthPDA(
      justinNFT.tokenAccount,
      program.programId
    );
    const justinCall = programForUser(program, justin);

    const tx = await justinCall.methods
      .thaw()
      .accounts({
        user: justin.wallet.publicKey,
        tokenAccount: justinNFT.tokenAccount,
        delegateAuth,
        tokenProgram: TOKEN_PROGRAM_ID,
        mint: justinNFT.mint,
        tokenMetadataProgram: METADATA_PROGRAM_ID,
        edition: justinNFT.edition,
      })
      .rpc();
    console.log("  Thaw transaction signature", tx);

    const ataInfo = await connection.getParsedAccountInfo(
      justinNFT.tokenAccount
    );
    const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
    assert.notEqual(parsed.info.state, "frozen");
  });

  // transfer to kp2
  // Get the token account of the toWallet address, and if it does not exist, create it
  it("Justin transfered his NFT to Markers while its not staked/frozen", async () => {
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      justin.wallet.payer,
      justinNFT.mint,
      markers.wallet.publicKey
    );

    await transfer(
      connection,
      justin.wallet.payer,
      justinNFT.tokenAccount,
      toTokenAccount.address,
      justin.wallet.publicKey,
      1
    );
  });

  it("Justin cannot stake his NFT anymore because he transferred it to Markers previously", async () => {
    const [delegateAuth] = await findDelegateAuthPDA(
      justinNFT.tokenAccount,
      program.programId
    );
    const justinCall = programForUser(program, justin);

    try {
      await justinCall.methods
        .freeze()
        .accounts({
          user: justin.wallet.publicKey,
          tokenAccount: justinNFT.tokenAccount,
          delegateAuth,
          tokenProgram: TOKEN_PROGRAM_ID,
          mint: justinNFT.mint,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          edition: justinNFT.edition,
        })
        .rpc();
    } catch (error) {
      assert.equal(
        error.message,
        "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x20"
      ); // cannot freeze `Not enough tokens to mint a limited edition`
      return;
    }

    assert.fail("The instruction should have failed with an empty account.");
  });

  // transfer to kp1
  // Get the token account of the toWallet address, and if it does not exist, create it
  it("Testing finished, Markers send the NFT back to Justin", async () => {
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      markers.wallet.payer,
      justinNFT.mint,
      justin.wallet.publicKey
    );

    await transfer(
      connection,
      markers.wallet.payer,
      markersNFT.tokenAccount,
      toTokenAccount.address,
      markers.wallet.publicKey,
      1
    );
  });
});
