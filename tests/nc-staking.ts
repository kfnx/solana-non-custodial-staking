import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { NcStaking } from "../target/types/nc_staking";

const localKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.SECRET_KEYPAIR)));
console.log(`signer: `, localKeypair.publicKey.toBase58());

describe("nc-staking", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.NcStaking as Program<NcStaking>;
  
  const tokenAccount = new PublicKey("BE9eZ6WSzKekD4pEgkoi3vud1BN1SjgrfsEe8DMQr5Hs");
  const [delegateAuth] = await PublicKey.findProgramAddress([Buffer.from('delegate'), tokenAccount.toBuffer()], program.programId);

  it("Freeze?", async () => {
    // Add your test here.
    const tx = await program.methods.freeze().accounts({
      user: localKeypair.publicKey,
      tokenAccount,
      delegateAuth,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).rpc();
    console.log("Your transaction signature", tx);
  });
});
