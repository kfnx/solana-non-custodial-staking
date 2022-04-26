import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { NcStaking } from "./target/types/nc_staking";

const freeze = async () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);
  console.log(`signer: `, provider.wallet.publicKey.toBase58());
  const program = anchor.workspace.NcStaking as Program<NcStaking>;

  // changes based on which account is holding the nft
  // const tokenAccount = new PublicKey("BE9eZ6WSzKekD4pEgkoi3vud1BN1SjgrfsEe8DMQr5Hs");
  const tokenAccount = new PublicKey("FdTMiWD7FAXhNmewHUSahAok896mtJfDRuSR4u1LsNsm");
  const [delegateAuth] = await PublicKey.findProgramAddress([Buffer.from('delegate'), tokenAccount.toBuffer()], program.programId);
  // changes based on the nft
  const mint = new PublicKey("AiFWNmitWNXQr3EazPDJWcAfEvU8KnPf69WAS6F6iFG7");
  const edition = new PublicKey("3Bff77s3HqbDa8WEcneMRF1NeUPhHVBPdFYd5g1upuRo");
  // always the same
  const tokenMetadataProgram = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
  console.log(delegateAuth.toBase58());

  const tx = await program.methods.freeze().accounts({
    user: provider.wallet.publicKey,
    tokenAccount,
    delegateAuth,
    tokenProgram: TOKEN_PROGRAM_ID,
    mint,
    tokenMetadataProgram,
    edition,
  }).rpc();
  console.log("Your transaction signature", tx);
};

freeze();

