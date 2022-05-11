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
import idl from "../target/idl/nc_staking.json";
import {
  TOKEN_METADATA_PROGRAM_ID,
  airdropUser,
  createUser,
  findUserATA,
  findDelegateAuthPDA,
} from "./utils";
import { NcStaking } from "../target/types/nc_staking";

describe("Non custodial staking", () => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const justin = createUser(
    connection,
    Keypair.fromSecretKey(
      Uint8Array.from([
        244, 32, 132, 254, 83, 48, 171, 241, 44, 221, 83, 7, 75, 133, 215, 247,
        83, 92, 156, 200, 48, 72, 176, 40, 54, 66, 179, 214, 38, 205, 143, 232,
        6, 249, 229, 84, 133, 153, 217, 45, 254, 55, 54, 162, 255, 149, 236,
        197, 218, 61, 204, 190, 153, 121, 136, 76, 84, 109, 230, 51, 167, 123,
        224, 25,
      ])
    )
  );
  const markers = createUser(
    connection,
    Keypair.fromSecretKey(
      Uint8Array.from([
        206, 215, 218, 86, 77, 204, 200, 3, 111, 91, 3, 5, 115, 142, 94, 232,
        178, 52, 125, 100, 97, 2, 219, 114, 212, 31, 160, 213, 89, 216, 92, 116,
        13, 45, 103, 206, 98, 224, 169, 15, 32, 116, 107, 194, 63, 241, 33, 247,
        230, 251, 1, 145, 140, 73, 115, 124, 212, 106, 229, 74, 133, 109, 173,
        79,
      ])
    )
  );
  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
  const justinProgram = new anchor.Program(
    <anchor.Idl>idl,
    program.programId,
    justin.provider
  );
  const markersProgram = new anchor.Program(
    <anchor.Idl>idl,
    program.programId,
    markers.provider
  );

  let justinNFT = {
    mint: new PublicKey("AiFWNmitWNXQr3EazPDJWcAfEvU8KnPf69WAS6F6iFG7"),
    ata: null,
    edition: new PublicKey("3Bff77s3HqbDa8WEcneMRF1NeUPhHVBPdFYd5g1upuRo"),
  };

  it("Set initial state", async () => {
    await airdropUser(justin.wallet.publicKey);
    await airdropUser(markers.wallet.publicKey);

    const getTokenAccount = await connection.getParsedTokenAccountsByOwner(
      justin.wallet.publicKey,
      {
        mint: justinNFT.mint,
      }
    );
    const tokenAccount = getTokenAccount.value[0].pubkey;
    justinNFT.ata = tokenAccount;

    const ataInfo = await connection.getParsedAccountInfo(tokenAccount);
    const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
    if (parsed.info.state === "frozen") {
      const [delegate] = await findDelegateAuthPDA(
        justinNFT.ata,
        program.programId
      );

      await justinProgram.methods
        .thaw()
        .accounts({
          user: justin.wallet.publicKey,
          mint: justinNFT.mint,
          tokenAccount: justinNFT.ata,
          edition: justinNFT.edition,
          delegate,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .rpc();
    }

    console.log("  Justin address", justin.wallet.publicKey.toBase58());
    console.log("  Justin NFT mint", justinNFT.mint.toBase58());
    console.log("  Justin NFT ata", justinNFT.ata.toBase58());
    console.log("  Justin NFT edition", justinNFT.edition.toBase58());
    console.log("  Markers address", markers.wallet.publicKey.toBase58());
  });

  it("Markers should not be able to stake/freeze Justin NFT", async () => {
    const [delegate] = await findDelegateAuthPDA(
      justinNFT.ata,
      program.programId
    );
    try {
      await markersProgram.methods
        .freeze()
        .accounts({
          user: markers.wallet.publicKey,
          mint: justinNFT.mint,
          tokenAccount: justinNFT.ata,
          edition: justinNFT.edition,
          delegate,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
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
    const [delegate] = await findDelegateAuthPDA(
      justinNFT.ata,
      program.programId
    );
    try {
      await markersProgram.methods
        .freeze()
        .accounts({
          user: justin.wallet.publicKey,
          mint: justinNFT.mint,
          tokenAccount: justinNFT.ata,
          delegate,
          edition: justinNFT.edition,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .rpc();
    } catch (error) {
      assert.equal(error.message, "Signature verification failed");
      return;
    }
  });

  it("Justin can stake/freeze his own NFT", async () => {
    const [delegate] = await findDelegateAuthPDA(
      justinNFT.ata,
      program.programId
    );
    const tx = await justinProgram.methods
      .freeze()
      .accounts({
        user: justin.wallet.publicKey,
        mint: justinNFT.mint,
        tokenAccount: justinNFT.ata,
        edition: justinNFT.edition,
        delegate,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .rpc();

    console.log("Freeze transaction signature", tx);
    const ataInfo = await connection.getParsedAccountInfo(justinNFT.ata);
    const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
    assert.equal(parsed.info.state, "frozen");
  });

  it("Justin cannot transfer his NFT if its staked (freze)", async () => {
    const markersNFTata = await findUserATA(
      markers.wallet.publicKey,
      justinNFT.mint
    );

    try {
      await transfer(
        connection,
        justin.wallet.payer,
        justinNFT.ata,
        markersNFTata,
        justin.wallet.publicKey,
        1
      );
    } catch (error) {
      assert.equal(
        error.message,
        "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x11"
      );
      return;
    }

    assert.fail("The instruction should have failed with a frozen account.");
  });

  it("Markers cannot unstake/thaw Justin NFT", async () => {
    const [delegate] = await findDelegateAuthPDA(
      justinNFT.ata,
      program.programId
    );
    try {
      await markersProgram.methods
        .freeze()
        .accounts({
          user: markers.wallet.publicKey,
          mint: justinNFT.mint,
          tokenAccount: justinNFT.ata,
          edition: justinNFT.edition,
          delegate,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
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
    const [delegate] = await findDelegateAuthPDA(
      justinNFT.ata,
      program.programId
    );
    try {
      await markersProgram.methods
        .freeze()
        .accounts({
          user: justin.wallet.publicKey,
          mint: justinNFT.mint,
          tokenAccount: justinNFT.ata,
          edition: justinNFT.edition,
          delegate,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .rpc();
    } catch (error) {
      assert.equal(error.message, "Signature verification failed");
      return;
    }
  });

  it("Justin can unstake/thaw his own NFT", async () => {
    const [delegate] = await findDelegateAuthPDA(
      justinNFT.ata,
      program.programId
    );
    const tx = await justinProgram.methods
      .thaw()
      .accounts({
        user: justin.wallet.publicKey,
        mint: justinNFT.mint,
        tokenAccount: justinNFT.ata,
        delegate,
        edition: justinNFT.edition,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      })
      .rpc();
    console.log("Thaw transaction signature", tx);

    const ataInfo = await connection.getParsedAccountInfo(justinNFT.ata);
    const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
    assert.notEqual(parsed.info.state, "frozen");
  });

  // transfer to kp2
  // Get the token account of the toWallet address, and if it does not exist, create it
  it("Justin can transfer his NFT to Markers while its not staked/frozen", async () => {
    const markersNFTata = await findUserATA(
      markers.wallet.publicKey,
      justinNFT.mint
    );

    await transfer(
      connection,
      justin.wallet.payer,
      justinNFT.ata,
      markersNFTata,
      justin.wallet.publicKey,
      1
    );
  });

  it("Justin cannot stake his NFT anymore because he transferred it to Markers previously", async () => {
    const [delegate] = await findDelegateAuthPDA(
      justinNFT.ata,
      program.programId
    );
    try {
      await justinProgram.methods
        .freeze()
        .accounts({
          user: justin.wallet.publicKey,
          tokenAccount: justinNFT.ata,
          delegate,
          tokenProgram: TOKEN_PROGRAM_ID,
          mint: justinNFT.mint,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          edition: justinNFT.edition,
        })
        .rpc();
    } catch (error) {
      assert.equal(
        error.message,
        "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x20"
      ); // cannot freeze `Not enough tokens to mint a limited edition: justinNFT.edition`
      return;
    }

    assert.fail("The instruction should have failed with an empty account.");
  });

  // transfer to kp1
  // Get the token account of the toWallet address, and if it does not exist, create it
  it("Testing finished, Markers send the NFT back to Justin", async () => {
    const justinNFTata = await findUserATA(
      justin.wallet.publicKey,
      justinNFT.mint
    );
    const markersNFTata = await findUserATA(
      markers.wallet.publicKey,
      justinNFT.mint
    );

    await transfer(
      connection,
      markers.wallet.payer,
      markersNFTata,
      justinNFTata,
      markers.wallet.publicKey,
      1
    );
  });
});
