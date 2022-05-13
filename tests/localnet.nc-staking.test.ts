import * as anchor from "@project-serum/anchor";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  ParsedAccountData,
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
import { actions } from "@metaplex/js";

describe("Non custodial staking", () => {
  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
  const admin = createUser();
  const user = createUser();
  const adminProgram = programForUser(program, admin);
  const userProgram = programForUser(program, user);
  const mint = Keypair.generate();

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
      const adminATA = await getOrCreateAssociatedTokenAccount(
        admin.provider.connection,
        admin.wallet.payer,
        mint.publicKey,
        admin.wallet.publicKey
      );

      console.log("create and init ATA", adminATA.address.toBase58());

      const mint_token_tx = new Transaction({
        feePayer: admin.wallet.publicKey,
      });

      mint_token_tx.add(
        createMintToInstruction(
          mint.publicKey, // mint
          adminATA.address, // receiver (should be a token account)
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
        adminATA.address
      );
      console.log(
        "mint",
        mint.publicKey.toBase58(),
        "ATA",
        adminATA.address.toBase58(),
        "balance",
        ataBalance
      );
    });

    it("admin create metadata", async () => {
      const metadata = await createMetadata(
        admin.provider.connection,
        admin.wallet,
        mint.publicKey
      );

      console.log("metadata", metadata.toBase58());
      console.log(
        "NFT",
        `https://explorer.solana.com/address/${mint.publicKey}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`
      );
    });

    it("admin send NFT to user", async () => {
      const adminATA = await getOrCreateAssociatedTokenAccount(
        admin.provider.connection,
        admin.wallet.payer,
        mint.publicKey,
        admin.wallet.publicKey
      );

      console.log(1, "adminATA.address", adminATA.address.toBase58());

      const userATA = await getOrCreateAssociatedTokenAccount(
        admin.provider.connection,
        admin.wallet.payer,
        mint.publicKey,
        user.wallet.publicKey
      );
      console.log(2, "userATA.address", userATA.address.toBase58());

      const transfer_token_tx = await transfer(
        admin.provider.connection,
        admin.wallet.payer,
        adminATA.address,
        userATA.address,
        admin.wallet.publicKey,
        1
        // [admin.wallet.payer, toWallet]
      );
      console.log(3, "transfer NFT to user tx", transfer_token_tx);

      const userAtaBalance = await getTokenBalanceByATA(
        user.provider.connection,
        userATA.address
      );
      console.log("user NFT: ", userAtaBalance);
      assert.equal(1, userAtaBalance, "user NFT 1, got it from admin");

      const adminAtaBalance = await getTokenBalanceByATA(
        admin.provider.connection,
        adminATA.address
      );
      console.log("admin NFT: ", adminAtaBalance);
      assert.equal(0, adminAtaBalance, "admin NFT 0, transferred to user");
    });
  });

  describe("User", () => {
    it("User can stake/freeze his own NFT", async () => {
      console.log(0);
      const userATA = await findUserATA(user.wallet.publicKey, mint.publicKey);

      console.log(1, "user ATA", userATA.toBase58());
      const [delegate] = await findDelegateAuthPDA(userATA, program.programId);
      console.log(2, "user delegate", delegate.toBase58());
      const [edition] = await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBytes(),
          mint.publicKey.toBytes(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      console.log(3, "edition", edition.toBase58());
      try {
        const tx = await userProgram.methods
          .freeze()
          .accounts({
            user: user.wallet.publicKey,
            mint: mint.publicKey,
            tokenAccount: userATA,
            delegate,
            edition,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          })
          .rpc();
        console.log(3, "Freeze transaction signature", tx);
      } catch (error) {
        console.error(error);
      }
      const ataInfo = await user.provider.connection.getParsedAccountInfo(
        userATA
      );
      const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
      console.log("parsed", parsed);
      assert.equal(parsed.info.state, "frozen");
    });

    // it("Justin cannot transfer his NFT if its staked (freze)", async () => {
    //   const markersNFTata = await findUserATA(
    //     markers.wallet.publicKey,
    //     justinNFT.mint
    //   );

    //   try {
    //     await transfer(
    //       connection,
    //       justin.wallet.payer,
    //       justinNFT.ata,
    //       markersNFTata,
    //       justin.wallet.publicKey,
    //       1
    //     );
    //   } catch (error) {
    //     assert.equal(
    //       error.message,
    //       "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x11"
    //     );
    //     return;
    //   }

    //   assert.fail("The instruction should have failed with a frozen account.");
    // });
  });
});
