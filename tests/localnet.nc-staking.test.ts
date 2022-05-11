import * as anchor from "@project-serum/anchor";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  getMinimumBalanceForRentExemptMint,
  getOrCreateAssociatedTokenAccount,
  MintLayout,
  TOKEN_PROGRAM_ID,
  transfer,
} from "@solana/spl-token";
import { assert } from "chai";
import {
  airdropUser,
  createUser,
  findDelegateAuthPDA,
  findUserATA,
  getTokenBalanceByATA,
  programForUser,
  TOKEN_METADATA_PROGRAM_ID,
} from "./utils";
import { NcStaking } from "../target/types/nc_staking";
import idl from "../target/idl/nc_staking.json";
import { createMetadata } from "./utils";
import { createMintToInstruction } from "@solana/spl-token";

describe("Non custodial staking", () => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
  const admin = createUser();
  const user = createUser();
  const adminProgram = programForUser(program, admin);
  const userProgram = programForUser(program, user);
  const mint = Keypair.generate();

  let justinNFT = {
    mint: new PublicKey("AiFWNmitWNXQr3EazPDJWcAfEvU8KnPf69WAS6F6iFG7"),
    ata: null,
    edition: new PublicKey("3Bff77s3HqbDa8WEcneMRF1NeUPhHVBPdFYd5g1upuRo"),
  };

  describe("Setup", () => {
    it("accounts", async () => {
      console.log("programId", program.programId.toBase58());
      console.log("mint", mint.publicKey.toBase58());
      console.log("admin", admin.wallet.publicKey.toBase58());
      console.log("user", user.wallet.publicKey.toBase58());
      await airdropUser(admin.wallet.publicKey);
      await airdropUser(user.wallet.publicKey);
    });
  });

  describe("Admin create NFT and metadata", () => {
    it("Create spl token", async () => {
      const create_mint_tx = new Transaction({
        feePayer: admin.wallet.publicKey,
      });

      create_mint_tx.add(
        SystemProgram.createAccount({
          fromPubkey: admin.wallet.publicKey,
          newAccountPubkey: mint.publicKey,
          space: MintLayout.span,
          lamports: await getMinimumBalanceForRentExemptMint(
            admin.provider.connection
          ),
          programId: TOKEN_PROGRAM_ID,
        })
      );
      create_mint_tx.add(
        createInitializeMintInstruction(
          mint.publicKey, // mint pubkey
          0, // decimals
          admin.wallet.publicKey, // mint authority
          admin.wallet.publicKey, // freeze authority (if you don't need it, you can set `null`)
          TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
        )
      );
      const create_mint_tx_sig = await admin.provider.sendAndConfirm(
        create_mint_tx,
        [admin.keypair, mint]
      );
      console.log("create mint tx", create_mint_tx_sig);
    });

    it("mint one", async () => {
      const assTokenAccount = await getOrCreateAssociatedTokenAccount(
        admin.provider.connection,
        admin.wallet.payer,
        mint.publicKey,
        admin.wallet.publicKey
      );

      console.log("create and init ATA", assTokenAccount.address.toBase58());

      const mint_token_tx = new Transaction({
        feePayer: admin.wallet.publicKey,
      });

      mint_token_tx.add(
        createMintToInstruction(
          mint.publicKey, // mint
          assTokenAccount.address, // receiver (sholud be a token account)
          admin.wallet.publicKey, // mint authority
          1, // amount. if your decimals is 8, you mint 10^8 for 1 token.
          [], // only multisig account will use. leave it empty now.
          TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
        )
      );

      const mint_token_tx_sig = await admin.provider.sendAndConfirm(
        mint_token_tx,
        [admin.keypair]
      );
      console.log("mint some tokens to reward pot tx", mint_token_tx_sig);

      const ataBalance = await getTokenBalanceByATA(
        admin.provider.connection,
        assTokenAccount.address
      );
      console.log("token balance: ", ataBalance);
    });

    it("admin create metadata", async () => {
      console.log(`before hang`);
      const gemMetadata = await createMetadata(
        admin.provider.connection,
        admin.wallet,
        mint.publicKey
      );

      console.log("gemMetadata", gemMetadata.toBase58());
      const account = await admin.provider.connection.getAccountInfo(
        gemMetadata
      );
      const accountP = await admin.provider.connection.getParsedAccountInfo(
        gemMetadata
      );
      console.log("account", account.data);
      console.log("account parsed", accountP.value);
    });
  });

  describe("User", () => {
    it("user staking freeze thaw peepoo", async () => {
      console.log("end");
    });
  });
});
