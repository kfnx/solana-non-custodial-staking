import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import {
  getMinimumBalanceForRentExemptMint,
  MintLayout,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  getOrCreateAssociatedTokenAccount,
  createMintToInstruction,
} from "@solana/spl-token";
import {
  getTokenBalanceByATA,
  createMetadata,
  createUser,
  allSynchronously,
  airdropUser,
  findUserATA,
  getSolanaBalance,
} from "./utils";
import { assert } from "chai";
import { transferToken } from "./utils/transaction";
import { store } from "./0-constants";

/**
 * This script can be used outside test by changing Anchor.toml test to target this file only
 * then run command below with your preferred cluster and wallet:
 * anchor test --provider.cluster localnet --provider.wallet $SOLANA_CONFIG_PATH/id.json --skip-deploy --skip-local-validator --skip-build --skip-lint
 */

const createNFT = async (
  creator: Keypair,
  mint: Keypair,
  meta: {
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: any[];
  }
) => {
  const NFTcreator = createUser(creator);
  const create_mint_tx = new Transaction({
    feePayer: NFTcreator.wallet.publicKey,
  });

  create_mint_tx.add(
    SystemProgram.createAccount({
      fromPubkey: NFTcreator.wallet.publicKey,
      newAccountPubkey: mint.publicKey,
      space: MintLayout.span,
      lamports: await getMinimumBalanceForRentExemptMint(
        NFTcreator.provider.connection
      ),
      programId: TOKEN_PROGRAM_ID,
    })
  );
  create_mint_tx.add(
    createInitializeMintInstruction(
      mint.publicKey, // mint pubkey
      0, // decimals
      NFTcreator.wallet.publicKey, // mint authority
      NFTcreator.wallet.publicKey, // freeze authority (if you don't need it, you can set `null`)
      TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
    )
  );

  const create_mint_tx_sig = await NFTcreator.provider.sendAndConfirm(
    create_mint_tx,
    [NFTcreator.keypair, mint]
  );
  // console.log("create mint tx", create_mint_tx_sig);

  const NFTcreatorATA = await getOrCreateAssociatedTokenAccount(
    NFTcreator.provider.connection,
    NFTcreator.wallet.payer,
    mint.publicKey,
    NFTcreator.wallet.publicKey
  );

  // console.log("create and init ATA", NFTcreatorATA.address.toBase58());

  const mint_token_tx = new Transaction({
    feePayer: NFTcreator.wallet.publicKey,
  });

  mint_token_tx.add(
    createMintToInstruction(
      mint.publicKey, // mint
      NFTcreatorATA.address, // receiver (should be a token account)
      NFTcreator.wallet.publicKey, // mint authority
      1, // amount. if your decimals is 8, you mint 10^8 for 1 token.
      [], // only multisig account will use. leave it empty now.
      TOKEN_PROGRAM_ID // always TOKEN_PROGRAM_ID
    )
  );

  const mint_token_tx_sig = await NFTcreator.provider.sendAndConfirm(
    mint_token_tx,
    [NFTcreator.keypair]
  );
  // console.log("mint tx", mint_token_tx_sig);

  // const ataBalance = await getTokenBalanceByATA(
  //   NFTcreator.provider.connection,
  //   NFTcreatorATA.address
  // );
  // console.log("mint", mint.publicKey.toBase58());
  // console.log("ATA", NFTcreatorATA.address.toBase58());
  // console.log("balance", ataBalance);

  const metadata = await createMetadata(
    NFTcreator.provider.connection,
    NFTcreator.wallet,
    mint.publicKey,
    {
      totalCreatorsN: 5,
      ourCreatorN: 1,
      leaveUnverified: false,
      skipEntirely: false,
    },
    meta
  );

  // console.log("metadata", metadata.toBase58());
  console.log(
    `🔗 https://explorer.solana.com/address/${mint.publicKey}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`
  );
  console.log(`✅ finish creating NFT`, meta.name);
};

describe("Generate Meekolony NFTs", () => {
  const { justin, NFTcreator, nfts } = store;
  const userId = justin.keypair.publicKey;
  it("Create mint and metadata", async () => {
    console.log(
      "Creator address",
      NFTcreator.wallet.publicKey.toBase58(),
      "balance",
      await getSolanaBalance(NFTcreator.wallet.publicKey)
    );
    await airdropUser(userId);
    console.log(
      "NFT holder address",
      userId.toBase58(),
      "balance",
      await getSolanaBalance(userId)
    );

    await allSynchronously(
      nfts.map(({ mint, metadata }) => async () => {
        await createNFT(NFTcreator.keypair, mint, metadata);

        // verify
        const createdATA = await findUserATA(
          NFTcreator.keypair.publicKey,
          mint.publicKey
        );
        const createdATAbalance = await getTokenBalanceByATA(
          NFTcreator.provider.connection,
          createdATA
        );
        assert.equal(createdATAbalance, 1, "token amount 1");

        await transferToken(NFTcreator.keypair, userId, mint.publicKey);

        // verify
        const userATA = await findUserATA(userId, mint.publicKey);
        const userATAbalance = await getTokenBalanceByATA(
          NFTcreator.provider.connection,
          userATA
        );
        assert.equal(userATAbalance, 1, "token amount 1");
      })
    );
  });
});
