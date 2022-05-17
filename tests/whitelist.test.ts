import chai, { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import * as anchor from "@project-serum/anchor";
import {
  Keypair,
  ParsedAccountData,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import {
  getMinimumBalanceForRentExemptMint,
  MintLayout,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getOrCreateAssociatedTokenAccount,
  createMintToInstruction,
  transfer,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "bn.js";
import { NcStaking } from "../target/types/nc_staking";
import {
  findUserStatePDA,
  airdropUser,
  createUser,
  getTokenBalanceByATA,
  createMetadata,
  findUserATA,
  findDelegateAuthPDA,
  findEditionPDA,
  TOKEN_METADATA_PROGRAM_ID,
  findConfigAuthorityPDA,
  findRewardPotPDA,
  delay,
  findWhitelistPDA,
} from "./utils";
import { programs } from "@metaplex/js";

chai.use(chaiAsPromised);

/**
 * This test journey covered by 3 type of user:
 * Dev where all the setup happen, e.g: create NFT
 * Justin as normal and kind user of the NFT project and staking program
 * Markers as bad user that try to exploit the program
 */
describe("User journey", () => {
  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
  const dev = createUser();
  const fakeDev = createUser();
  const NftCollectionCreator = Keypair.generate();
  const config = Keypair.generate();
  const rewardMint = Keypair.generate();
  const justin = createUser();
  const markers = createUser();
  const NFTmint = Keypair.generate();
  const FakeNFTmint = Keypair.generate();

  describe("Create NFT and setup staking config", () => {
    it("Users created", async () => {
      console.log("Dev address", dev.keypair.publicKey.toBase58());
      await airdropUser(dev.wallet.publicKey);
      console.log("Fake Dev address", dev.keypair.publicKey.toBase58());
      await airdropUser(fakeDev.wallet.publicKey);
    });

    it("Dev create staking reward token", async () => {
      const create_mint_tx = new Transaction({
        feePayer: dev.wallet.publicKey,
      });

      create_mint_tx.add(
        SystemProgram.createAccount({
          fromPubkey: dev.wallet.publicKey,
          newAccountPubkey: rewardMint.publicKey,
          space: MintLayout.span,
          lamports: await getMinimumBalanceForRentExemptMint(
            dev.provider.connection
          ),
          programId: TOKEN_PROGRAM_ID,
        })
      );
      create_mint_tx.add(
        createInitializeMintInstruction(
          rewardMint.publicKey, // rewardMint pubkey
          0, // decimals
          dev.wallet.publicKey, // rewardMint authority
          dev.wallet.publicKey, // freeze authority (if you don't need it, you can set `null`)
          TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
        )
      );
      const create_mint_tx_sig = await dev.provider.sendAndConfirm(
        create_mint_tx,
        [dev.keypair, rewardMint]
      );
      console.log("create rewardMint tx", create_mint_tx_sig);
    });

    it("Dev create staking config", async () => {
      console.log("config", config.publicKey.toBase58());
      const [configAuth, configAuthBump] = await findConfigAuthorityPDA(
        config.publicKey
      );
      console.log("configAuth", configAuth.toBase58());

      const [rewardPot] = await findRewardPotPDA(
        config.publicKey,
        rewardMint.publicKey
      );
      console.log("reward pot", rewardPot.toBase58());

      // init staking config
      const rewardRate = new BN(10);
      const initStakingTx = await program.methods
        .initStakingConfig(configAuthBump, rewardRate)
        .accounts({
          admin: dev.wallet.publicKey,
          config: config.publicKey,
          configAuthority: configAuth,
          rewardMint: rewardMint.publicKey,
          rewardPot: rewardPot,
          // programs
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([dev.keypair, config])
        .rpc();
      console.log("init config tx", initStakingTx);

      const allStakingAccounts = await program.account.stakingConfig.all();
      assert.equal(
        allStakingAccounts.length,
        1,
        "should be only 1 staking config account"
      );

      const account = await program.account.stakingConfig.fetch(
        config.publicKey
      );

      assert.ok(account.admin.equals(dev.wallet.publicKey));
      assert.ok(account.rewardMint.equals(rewardMint.publicKey));
      assert.ok(account.rewardRate.toNumber() === rewardRate.toNumber());
    });

    it("Dev fund reward pot so user can claim reward tokens", async () => {
      const stakingConfig = await program.account.stakingConfig.fetch(
        config.publicKey
      );

      const mint_tokens_to_reward_pot_tx = new Transaction({
        feePayer: dev.wallet.publicKey,
      });
      const mint_amount = 2_000_000;
      mint_tokens_to_reward_pot_tx.add(
        createMintToInstruction(
          rewardMint.publicKey, // mint
          stakingConfig.rewardPot, // receiver (sholud be a token account)
          dev.wallet.publicKey, // mint authority
          mint_amount, // amount. if your decimals is 8, you mint 10^8 for 1 token.
          [], // only multisig account will use. leave it empty now.
          TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
        )
      );

      const mint_tokens_to_reward_pot_tx_sig =
        await dev.provider.sendAndConfirm(mint_tokens_to_reward_pot_tx, [
          dev.keypair,
        ]);
      console.log(
        "mint some tokens to reward pot tx",
        mint_tokens_to_reward_pot_tx_sig
      );

      const rewardPotBalance = await getTokenBalanceByATA(
        dev.provider.connection,
        stakingConfig.rewardPot
      );
      console.log("funded reward pot token balance: ", rewardPotBalance);

      assert.equal(mint_amount, rewardPotBalance, "reward pot funded");
    });

    it("Official Dev create NFT", async () => {
      const create_mint_tx = new Transaction({
        feePayer: dev.wallet.publicKey,
      });

      create_mint_tx.add(
        SystemProgram.createAccount({
          fromPubkey: dev.wallet.publicKey,
          newAccountPubkey: NFTmint.publicKey,
          space: MintLayout.span,
          lamports: await getMinimumBalanceForRentExemptMint(
            dev.provider.connection
          ),
          programId: TOKEN_PROGRAM_ID,
        })
      );
      create_mint_tx.add(
        createInitializeMintInstruction(
          NFTmint.publicKey, // NFTmint pubkey
          0, // decimals
          dev.wallet.publicKey, // NFTmint authority
          dev.wallet.publicKey, // freeze authority (if you don't need it, you can set `null`)
          TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
        )
      );
      const create_mint_tx_sig = await dev.provider.sendAndConfirm(
        create_mint_tx,
        [dev.keypair, NFTmint]
      );
      console.log("create NFTmint tx", create_mint_tx_sig);
    });

    it("Mint NFT", async () => {
      const devATA = await getOrCreateAssociatedTokenAccount(
        dev.provider.connection,
        dev.wallet.payer,
        NFTmint.publicKey,
        dev.wallet.publicKey
      );

      console.log("create and init ATA", devATA.address.toBase58());

      const mint_token_tx = new Transaction({
        feePayer: dev.wallet.publicKey,
      });

      mint_token_tx.add(
        createMintToInstruction(
          NFTmint.publicKey, // NFTmint
          devATA.address, // receiver (should be a token account)
          dev.wallet.publicKey, // NFTmint authority
          1, // amount. if your decimals is 8, you NFTmint 10^8 for 1 token.
          [], // only multisig account will use. leave it empty now.
          TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
        )
      );

      const mint_token_tx_sig = await dev.provider.sendAndConfirm(
        mint_token_tx,
        [dev.keypair]
      );
      console.log("mint some tokens to reward pot tx", mint_token_tx_sig);

      const ataBalance = await getTokenBalanceByATA(
        dev.provider.connection,
        devATA.address
      );
      console.log(
        "mint",
        NFTmint.publicKey.toBase58(),
        "ATA",
        devATA.address.toBase58(),
        "balance",
        ataBalance
      );
    });

    it("Official Dev create NFT metadata", async () => {
      const metadata = await createMetadata(
        dev.provider.connection,
        dev.wallet,
        NFTmint.publicKey
      );

      console.log("metadata", metadata.toBase58());
      console.log(
        "NFT",
        `https://explorer.solana.com/address/${NFTmint.publicKey}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`
      );
    });

    it("Dev whitelist NFT creator address", async () => {
      // const [configAuthority, bumpConfigAuthority] =
      //   await findConfigAuthorityPDA(config.publicKey);
      const [whitelist] = await findWhitelistPDA(
        config.publicKey,
        dev.wallet.publicKey
      );
      console.log("whitelist proof PDA", whitelist.toBase58());

      await program.methods
        .addWhitelist()
        .accounts({
          admin: dev.wallet.publicKey,
          config: config.publicKey,
          whitelist,
          creatorAddressToWhitelist: dev.wallet.publicKey,
        })
        .signers([dev.keypair])
        .rpc();

      const whitelistAcc = await program.account.whitelist.fetch(whitelist);
      console.log(
        "whitelist pda",
        whitelistAcc.creator.toBase58(),
        dev.wallet.publicKey.toBase58()
      );

      const configAcc = await program.account.stakingConfig.fetch(
        config.publicKey
      );
      console.log("config.whitelistedCreator", configAcc.whitelistedCreator);
    });

    it("Dev send NFT to Justin", async () => {
      const devATA = await getOrCreateAssociatedTokenAccount(
        dev.provider.connection,
        dev.wallet.payer,
        NFTmint.publicKey,
        dev.wallet.publicKey
      );

      console.log("devATA.address", devATA.address.toBase58());

      const justinATA = await getOrCreateAssociatedTokenAccount(
        dev.provider.connection,
        dev.wallet.payer,
        NFTmint.publicKey,
        justin.wallet.publicKey
      );
      console.log("justinATA.address", justinATA.address.toBase58());

      const transfer_token_tx = await transfer(
        dev.provider.connection,
        dev.wallet.payer,
        devATA.address,
        justinATA.address,
        dev.wallet.publicKey,
        1
        // [dev.wallet.payer, toWallet]
      );
      console.log("transfer NFT to justin tx", transfer_token_tx);

      const justinAtaBalance = await getTokenBalanceByATA(
        justin.provider.connection,
        justinATA.address
      );
      console.log("justin NFT: ", justinAtaBalance);
      assert.equal(1, justinAtaBalance, "justin NFT 1, got it from dev");

      const devAtaBalance = await getTokenBalanceByATA(
        dev.provider.connection,
        devATA.address
      );
      console.log("Dev NFT: ", devAtaBalance);
      assert.equal(0, devAtaBalance, "Dev NFT 0, transferred to justin");
    });

    it("Fake Dev create NFT", async () => {
      const create_mint_tx = new Transaction({
        feePayer: fakeDev.wallet.publicKey,
      });

      create_mint_tx.add(
        SystemProgram.createAccount({
          fromPubkey: fakeDev.wallet.publicKey,
          newAccountPubkey: FakeNFTmint.publicKey,
          space: MintLayout.span,
          lamports: await getMinimumBalanceForRentExemptMint(
            fakeDev.provider.connection
          ),
          programId: TOKEN_PROGRAM_ID,
        })
      );
      create_mint_tx.add(
        createInitializeMintInstruction(
          FakeNFTmint.publicKey, // FakeNFTmint pubkey
          0, // decimals
          fakeDev.wallet.publicKey, // FakeNFTmint authority
          fakeDev.wallet.publicKey, // freeze authority (if you don't need it, you can set `null`)
          TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
        )
      );
      const create_mint_tx_sig = await fakeDev.provider.sendAndConfirm(
        create_mint_tx,
        [fakeDev.keypair, FakeNFTmint]
      );
      console.log("create FakeNFTmint tx", create_mint_tx_sig);
    });

    it("Mint Fake NFT", async () => {
      const fakeDevATA = await getOrCreateAssociatedTokenAccount(
        fakeDev.provider.connection,
        fakeDev.wallet.payer,
        FakeNFTmint.publicKey,
        fakeDev.wallet.publicKey
      );

      console.log("create and init ATA", fakeDevATA.address.toBase58());

      const mint_token_tx = new Transaction({
        feePayer: fakeDev.wallet.publicKey,
      });

      mint_token_tx.add(
        createMintToInstruction(
          FakeNFTmint.publicKey, // FakeNFTmint
          fakeDevATA.address, // receiver (should be a token account)
          fakeDev.wallet.publicKey, // FakeNFTmint authority
          1, // amount. if your decimals is 8, you FakeNFTmint 10^8 for 1 token.
          [], // only multisig account will use. leave it empty now.
          TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
        )
      );

      const mint_token_tx_sig = await fakeDev.provider.sendAndConfirm(
        mint_token_tx,
        [fakeDev.keypair]
      );
      console.log("mint some tokens to reward pot tx", mint_token_tx_sig);

      const ataBalance = await getTokenBalanceByATA(
        fakeDev.provider.connection,
        fakeDevATA.address
      );
      console.log(
        "mint",
        FakeNFTmint.publicKey.toBase58(),
        "ATA",
        fakeDevATA.address.toBase58(),
        "balance",
        ataBalance
      );
    });

    it("Fake Dev create NFT metadata", async () => {
      const metadata = await createMetadata(
        fakeDev.provider.connection,
        fakeDev.wallet,
        FakeNFTmint.publicKey
      );

      console.log("metadata", metadata.toBase58());
      console.log(
        "Fake NFT",
        `https://explorer.solana.com/address/${FakeNFTmint.publicKey}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`
      );
    });

    it("Fake Dev send NFT to Justin", async () => {
      const fakeDevATA = await getOrCreateAssociatedTokenAccount(
        fakeDev.provider.connection,
        fakeDev.wallet.payer,
        FakeNFTmint.publicKey,
        fakeDev.wallet.publicKey
      );

      console.log("fakeDevATA.address", fakeDevATA.address.toBase58());

      const justinATA = await getOrCreateAssociatedTokenAccount(
        fakeDev.provider.connection,
        fakeDev.wallet.payer,
        FakeNFTmint.publicKey,
        justin.wallet.publicKey
      );
      console.log("justinATA.address", justinATA.address.toBase58());

      const transfer_token_tx = await transfer(
        fakeDev.provider.connection,
        fakeDev.wallet.payer,
        fakeDevATA.address,
        justinATA.address,
        fakeDev.wallet.publicKey,
        1
        // [fakeDev.wallet.payer, toWallet]
      );
      console.log("transfer NFT to justin tx", transfer_token_tx);

      const justinAtaBalance = await getTokenBalanceByATA(
        justin.provider.connection,
        justinATA.address
      );
      console.log("justin NFT: ", justinAtaBalance);
      assert.equal(1, justinAtaBalance, "justin NFT 1, got it from fakeDev");

      const fakeDevAtaBalance = await getTokenBalanceByATA(
        fakeDev.provider.connection,
        fakeDevATA.address
      );
      console.log("Dev NFT: ", fakeDevAtaBalance);
      assert.equal(0, fakeDevAtaBalance, "Dev NFT 0, transferred to justin");
    });
  });

  describe("NFT owner Justin exist", () => {
    it("User Justin created", async () => {
      console.log("Justin address", justin.keypair.publicKey.toBase58());
      await airdropUser(justin.wallet.publicKey);
    });

    it("Justin initate staking", async () => {
      const [userState, _vaultBump] = await findUserStatePDA(
        justin.wallet.publicKey
      );

      await program.methods
        .initStaking()
        .accounts({
          userState,
          user: justin.wallet.publicKey,
        })
        .signers([justin.keypair])
        .rpc();

      const account = await program.account.user.fetch(userState);
      assert.ok(account.user.equals(justin.wallet.publicKey));
      assert.ok(account.nftsStaked.toNumber() === 0);
    });

    it("Justin cannot init staking twice", async () => {
      const [userState] = await findUserStatePDA(justin.wallet.publicKey);

      try {
        await program.methods
          .initStaking()
          .accounts({
            userState,
            user: justin.wallet.publicKey,
          })
          .signers([justin.keypair])
          .rpc();
      } catch (error) {
        assert.equal(
          error.message,
          "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x0"
        );
      }
    });

    it("Justin stake official collection NFT", async () => {
      const justinATA = await findUserATA(
        justin.wallet.publicKey,
        NFTmint.publicKey
      );
      console.log("justin ATA", justinATA.toBase58());
      const [delegate] = await findDelegateAuthPDA(justinATA);
      console.log("justin delegate", delegate.toBase58());
      const [edition] = await findEditionPDA(NFTmint.publicKey);
      console.log("edition", edition.toBase58());
      const [justinState] = await findUserStatePDA(justin.wallet.publicKey);
      console.log("justin state", justinState.toBase58());
      try {
        const [whitelist] = await findWhitelistPDA(
          config.publicKey,
          dev.wallet.publicKey
        );
        const metadata = await programs.metadata.Metadata.getPDA(
          NFTmint.publicKey
        );

        const tx = await program.methods
          .stake()
          .accounts({
            user: justin.wallet.publicKey,
            userState: justinState,
            config: config.publicKey,
            tokenAccount: justinATA,
            delegate,
            edition,
            mint: NFTmint.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([justin.keypair])
          .remainingAccounts([
            {
              pubkey: metadata,
              isWritable: false,
              isSigner: false,
            },
            {
              pubkey: whitelist,
              isWritable: false,
              isSigner: false,
            },
          ])
          .rpc();
        console.log("Stake transaction signature", tx);
      } catch (error) {
        console.error(error);
      }
      const ataInfo = await justin.provider.connection.getParsedAccountInfo(
        justinATA
      );
      const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
      assert.equal(parsed.info.state, "frozen");

      const account = await program.account.user.fetch(justinState);

      assert.ok(account.user.equals(justin.wallet.publicKey));
      assert.ok(account.nftsStaked.toNumber() === 1);
    });

    it("Justin cannot stake unofficial/fake collection NFT", async () => {
      const justinFakeNftATA = await findUserATA(
        justin.wallet.publicKey,
        FakeNFTmint.publicKey
      );
      console.log("justin ATA", justinFakeNftATA.toBase58());
      const [delegate] = await findDelegateAuthPDA(justinFakeNftATA);
      console.log("justin delegate", delegate.toBase58());
      const [edition] = await findEditionPDA(FakeNFTmint.publicKey);
      console.log("edition", edition.toBase58());
      const [justinState] = await findUserStatePDA(justin.wallet.publicKey);
      console.log("justin state", justinState.toBase58());
      const [whitelist] = await findWhitelistPDA(
        config.publicKey,
        fakeDev.wallet.publicKey
      );
      const metadata = await programs.metadata.Metadata.getPDA(
        FakeNFTmint.publicKey
      );

      await expect(
        program.methods
          .stake()
          .accounts({
            user: justin.wallet.publicKey,
            userState: justinState,
            config: config.publicKey,
            tokenAccount: justinFakeNftATA,
            delegate,
            edition,
            mint: FakeNFTmint.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([justin.keypair])
          .remainingAccounts([
            {
              pubkey: metadata,
              isWritable: false,
              isSigner: false,
            },
            {
              pubkey: whitelist,
              isWritable: false,
              isSigner: false,
            },
          ])
          .rpc()
      ).to.be.rejectedWith("NotWhitelisted");

      const ataInfo = await justin.provider.connection.getParsedAccountInfo(
        justinFakeNftATA
      );
      // state doesnt change to freeze
      const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
      assert.equal(parsed.info.state, "initialized");
    });
  });
});
