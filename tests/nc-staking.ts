import * as anchor from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { NcStaking } from "../target/types/nc_staking";

/**
 * TODO: will revisit this test file after we know how to test end to end without local keypair.
 * e.g: from create NFT, send to someone, then freeze it creator freeze it by pda, etc
 */


describe("nc-staking", async () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  const localKeypair = provider.wallet;
  console.log(`signer: `, localKeypair.publicKey.toBase58());
  anchor.setProvider(provider);

  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;

  const tokenAccount = new PublicKey(
    "BE9eZ6WSzKekD4pEgkoi3vud1BN1SjgrfsEe8DMQr5Hs"
  );
  const [delegateAuth] = await PublicKey.findProgramAddress(
    [Buffer.from("delegate"), tokenAccount.toBuffer()],
    program.programId
  );

  it("Freeze?", async () => {
    // Add your test here.
    const tx = await program.methods
      .freeze()
      .accounts({
        user: localKeypair.publicKey,
        tokenAccount,
        delegateAuth,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });
});
