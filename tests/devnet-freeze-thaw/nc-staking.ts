import * as anchor from "@project-serum/anchor";
import { clusterApiUrl, Connection, Keypair, ParsedAccountData, PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID, transfer } from "@solana/spl-token";
import { assert } from "chai";
import idl from "../../target/idl/nc_staking.json";
/**
 * TODO: will revisit this test file after we know how to test end to end without local keypair.
 * e.g: from create NFT, send to someone, then freeze it creator freeze it by pda, etc
 */
// UETQgtvJWRcMsqEqHtEBGyHHzDtebar3eWE79g4y2H6
const keypair1 = Keypair.fromSecretKey(Uint8Array.from([244, 32, 132, 254, 83, 48, 171, 241, 44, 221, 83, 7, 75, 133, 215, 247, 83, 92, 156, 200, 48, 72, 176, 40, 54, 66, 179, 214, 38, 205, 143, 232, 6, 249, 229, 84, 133, 153, 217, 45, 254, 55, 54, 162, 255, 149, 236, 197, 218, 61, 204, 190, 153, 121, 136, 76, 84, 109, 230, 51, 167, 123, 224, 25]));
// tSTW5PWzjDYCjeYEqpZg92PyRv7R733YPx9Diz6BUWr
const keypair2 = Keypair.fromSecretKey(Uint8Array.from([206, 215, 218, 86, 77, 204, 200, 3, 111, 91, 3, 5, 115, 142, 94, 232, 178, 52, 125, 100, 97, 2, 219, 114, 212, 31, 160, 213, 89, 216, 92, 116, 13, 45, 103, 206, 98, 224, 169, 15, 32, 116, 107, 194, 63, 241, 33, 247, 230, 251, 1, 145, 140, 73, 115, 124, 212, 106, 229, 74, 133, 109, 173, 79]))

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const wallet1 = new anchor.Wallet(keypair1);
const provider1 = new anchor.AnchorProvider(connection, wallet1, { commitment: "confirmed" });
const ata1 = new PublicKey("BE9eZ6WSzKekD4pEgkoi3vud1BN1SjgrfsEe8DMQr5Hs");
const wallet2 = new anchor.Wallet(keypair2);
const provider2 = new anchor.AnchorProvider(connection, wallet2, { commitment: "confirmed" });
const ata2 = new PublicKey("FdTMiWD7FAXhNmewHUSahAok896mtJfDRuSR4u1LsNsm");
// changes based on the nft
const mint = new PublicKey("AiFWNmitWNXQr3EazPDJWcAfEvU8KnPf69WAS6F6iFG7"); // pre-setup
const edition = new PublicKey("3Bff77s3HqbDa8WEcneMRF1NeUPhHVBPdFYd5g1upuRo");
// always the same
const tokenMetadataProgram = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

const progId = new PublicKey("stakEUMMv9bRHYX4CyVY48i19ViBdNSzn8Rt1a1Fi6E");

const program1 = new anchor.Program(<anchor.Idl>idl, progId, provider1);
const program2 = new anchor.Program(<anchor.Idl>idl, progId, provider2);

describe("nc-staking", async () => {
  // changes based on which account is holding the nft
  const tokenAccount = ata1;
  const [delegateAuth] = await PublicKey.findProgramAddress([Buffer.from('delegate'), tokenAccount.toBuffer()], program1.programId);

  it("Unable to freeze with non owner caller", async () => {
    try {
      await program2.methods
        .freeze()
        .accounts({
          user: wallet2.publicKey,
          tokenAccount,
          delegateAuth,
          tokenProgram: TOKEN_PROGRAM_ID,
          mint,
          tokenMetadataProgram,
          edition,
        })
        .rpc();
    } catch (error) {
      assert.equal(error.message, 'AnchorError caused by account: token_account. Error Code: ConstraintRaw. Error Number: 2003. Error Message: A raw constraint was violated.');
      return;
    }
  });

  it("Unable to freeze with non owner caller part 2", async () => {
    try {
      await program2.methods
        .freeze()
        .accounts({
          user: wallet1.publicKey,
          tokenAccount,
          delegateAuth,
          tokenProgram: TOKEN_PROGRAM_ID,
          mint,
          tokenMetadataProgram,
          edition,
        })
        .rpc();
    } catch (error) {
      assert.equal(error.message, 'Signature verification failed');
      return;
    }
  });

  it("Freeze", async () => {
    const tx = await program1.methods
      .freeze()
      .accounts({
        user: wallet1.publicKey,
        tokenAccount,
        delegateAuth,
        tokenProgram: TOKEN_PROGRAM_ID,
        mint,
        tokenMetadataProgram,
        edition,
      })
      .rpc();

    console.log("Freeze transaction signature", tx);
    const ataInfo = await connection.getParsedAccountInfo(tokenAccount);
    const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
    assert.equal(parsed.info.state, 'frozen')
  });

  it("Unable to transfer the token to 2nd wallet", async () => {
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, wallet1.payer, mint, wallet2.publicKey);
    try {
      await transfer(
        connection,
        wallet1.payer,
        ata1,
        toTokenAccount.address,
        wallet1.publicKey,
        1
      );
    } catch (error) {
      assert.equal(error.message, 'failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x11'); // frozen
      return;
    }

    assert.fail('The instruction should have failed with a frozen account.');
  });

  it("Unable to thaw with non owner caller", async () => {
    try {
      await program2.methods
        .freeze()
        .accounts({
          user: wallet2.publicKey,
          tokenAccount,
          delegateAuth,
          tokenProgram: TOKEN_PROGRAM_ID,
          mint,
          tokenMetadataProgram,
          edition,
        })
        .rpc();
    } catch (error) {
      assert.equal(error.message, 'AnchorError caused by account: token_account. Error Code: ConstraintRaw. Error Number: 2003. Error Message: A raw constraint was violated.');
      return;
    }
  });
  it("Unable to thaw with non owner caller part 2", async () => {
    try {
      await program2.methods
        .freeze()
        .accounts({
          user: wallet1.publicKey,
          tokenAccount,
          delegateAuth,
          tokenProgram: TOKEN_PROGRAM_ID,
          mint,
          tokenMetadataProgram,
          edition,
        })
        .rpc();
    } catch (error) {
      assert.equal(error.message, 'Signature verification failed');
      return;
    }
  });

  it("Thaw", async () => {
    const tx = await program1.methods
      .thaw()
      .accounts({
        user: wallet1.publicKey,
        tokenAccount,
        delegateAuth,
        tokenProgram: TOKEN_PROGRAM_ID,
        mint,
        tokenMetadataProgram,
        edition,
      })
      .rpc();
    console.log("Thaw transaction signature", tx);

    const ataInfo = await connection.getParsedAccountInfo(tokenAccount);
    const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
    assert.notEqual(parsed.info.state, 'frozen')
  });

  // transfer to kp2
  // Get the token account of the toWallet address, and if it does not exist, create it
  it("Transfer the token to 2nd wallet", async () => {
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, wallet1.payer, mint, wallet2.publicKey);

    await transfer(
      connection,
      wallet1.payer,
      ata1,
      toTokenAccount.address,
      wallet1.publicKey,
      1
    );
  });


  it("Unable to freeze empty account", async () => {
    try {
      await program1.methods
        .freeze()
        .accounts({
          user: wallet1.publicKey,
          tokenAccount,
          delegateAuth,
          tokenProgram: TOKEN_PROGRAM_ID,
          mint,
          tokenMetadataProgram,
          edition,
        })
        .rpc();
    }
    catch (error) {
      assert.equal(error.message, 'failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x20'); // cannot freeze `Not enough tokens to mint a limited edition`
      return;
    }

    assert.fail('The instruction should have failed with an empty account.');
  });


  // transfer to kp1
  // Get the token account of the toWallet address, and if it does not exist, create it
  it("Transfer the token to 1st wallet", async () => {
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, wallet2.payer, mint, wallet1.publicKey);

    await transfer(
      connection,
      wallet2.payer,
      ata2,
      toTokenAccount.address,
      wallet2.publicKey,
      1
    );
  });

});
