import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { NcStaking } from "./target/types/nc_staking";

const localKeypair = Keypair.fromSecretKey(Uint8Array.from([244,32,132,254,83,48,171,241,44,221,83,7,75,133,215,247,83,92,156,200,48,72,176,40,54,66,179,214,38,205,143,232,6,249,229,84,133,153,217,45,254,55,54,162,255,149,236,197,218,61,204,190,153,121,136,76,84,109,230,51,167,123,224,25]));
console.log(`signer: `, localKeypair.publicKey.toBase58());

const freeze = async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.NcStaking as Program<NcStaking>;
  
  const tokenAccount = new PublicKey("BE9eZ6WSzKekD4pEgkoi3vud1BN1SjgrfsEe8DMQr5Hs");
  const [delegateAuth] = await PublicKey.findProgramAddress([Buffer.from('delegate'), tokenAccount.toBuffer()], program.programId);

  const tx = await program.methods.freeze().accounts({
    user: localKeypair.publicKey,
    tokenAccount,
    delegateAuth,
    tokenProgram: TOKEN_PROGRAM_ID,
  }).rpc();
  console.log("Your transaction signature", tx);
};

freeze();

