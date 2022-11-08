import chai, { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import * as anchor from "@project-serum/anchor";
import { ParsedAccountData } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { NcStaking } from "../target/types/nc_staking";
import {
  findUserStatePDA,
  airdropUser,
  findUserATA,
  findStakeInfoPDA,
  timeNow,
  getSolanaBalance,
} from "./utils";
import { store } from "./0-constants";
import { adminUnstake, stake } from "./utils/transactions";

chai.use(chaiAsPromised);

/**
 * Configs and NFTs are created on test 1 and 2.
 * Justin as normal and kind user test the NFT project and staking program
 * Admin as project owner
 * uncomment the logs for debugging
 */

describe("User journey", () => {
  const { dev, justin, nfts, configs } = store;
  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
  const config = configs[0].keypair;
  const nft = nfts[4].mint.publicKey;

  describe("NFT owner Justin exist", () => {
    // it("User Justin created", async () => {
    //   await airdropUser(justin.wallet.publicKey);
    //   console.log(
    //     "Justin address",
    //     justin.keypair.publicKey.toBase58(),
    //     "balance",
    //     await getSolanaBalance(justin.wallet.publicKey)
    //   );
    // });

    // it("Justin initate staking", async () => {
    //   const [userState] = await findUserStatePDA(
    //     justin.wallet.publicKey,
    //     config.publicKey
    //   );

    //   await program.methods
    //     .initStaking()
    //     .accounts({
    //       userState,
    //       config: config.publicKey,
    //       user: justin.wallet.publicKey,
    //     })
    //     .signers([justin.keypair])
    //     .rpc();

    //   const account = await program.account.userV2.fetch(userState);
    //   assert.ok(account.user.equals(justin.wallet.publicKey));
    //   assert.ok(account.nftsStaked.toNumber() === 0);
    // });

    // Justin initiated staking already from previous test
    it("Justin stake one NFT", async () => {
      const justinATA = await findUserATA(justin.wallet.publicKey, nft);

      const tx = await stake(program, justin, config.publicKey, nft);
      console.log(timeNow(), "stake NFT tx", tx);

      const ataInfo = await justin.provider.connection.getParsedAccountInfo(
        justinATA
      );
      const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
      assert.equal(parsed.info.state, "frozen");

      const [justinState] = await findUserStatePDA(
        justin.wallet.publicKey,
        config.publicKey
      );
      const account = await program.account.userV2.fetch(justinState);

      assert.ok(account.user.equals(justin.wallet.publicKey));
      assert.ok(account.nftsStaked.toNumber() === 1);
    });

    it("Oh no, justin wallet is compromised! Admin unstake Justin NFT despite the locktime and transfer to admin wallet", async () => {
      // initialize admin ATA to hold the NFT after unstaked
      const adminATA = await getOrCreateAssociatedTokenAccount(
        dev.provider.connection,
        dev.wallet.payer,
        nft,
        dev.wallet.publicKey
      );
      console.log(
        "admin balance:",
        await getSolanaBalance(dev.wallet.publicKey)
      );
      const unstakeTx = await adminUnstake(
        program,
        justin,
        config.publicKey,
        nft,
        dev.keypair
      );
      console.log(timeNow(), "unstake tx", unstakeTx);

      const [stakeInfo] = await findStakeInfoPDA(justin.wallet.publicKey, nft);

      // account should be closed and user reclaim rent fee
      await expect(
        program.account.stakeInfo.fetch(stakeInfo)
      ).to.be.rejectedWith("Account does not exist");

      const ataInfo = await dev.provider.connection.getParsedAccountInfo(
        adminATA.address
      );
      const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;

      assert.equal(
        parsed.info.state,
        "initialized",
        "NFT state should be initialized if unstaking success"
      );
      console.log(
        "admin balance:",
        await getSolanaBalance(dev.wallet.publicKey)
      );
      {
        const adminATA = await findUserATA(dev.wallet.publicKey, nft);
        const ataInfo = await dev.provider.connection.getParsedAccountInfo(
          adminATA
        );
        const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
        assert.equal(
          parsed.info.state,
          "initialized",
          "NFT should be initialized after unstaked"
        );
        // console.log("Admin NFT state:", parsed.info.state);
        assert.equal(
          parsed.info.tokenAmount.amount,
          1,
          "Admin NFT amount value should be 1 because it transfered to admin ATA"
        );
        console.log("Admin NFT amount:", parsed.info.tokenAmount.amount);
      }
      {
        const justinATA = await findUserATA(justin.wallet.publicKey, nft);
        const ataInfo = await justin.provider.connection.getParsedAccountInfo(
          justinATA
        );
        const parsed = (<ParsedAccountData>ataInfo.value.data).parsed;
        assert.equal(
          parsed.info.state,
          "initialized",
          "NFT should be initialized after unstaked"
        );
        // console.log("Justin NFT state:", parsed.info.state);
        assert.equal(
          parsed.info.tokenAmount.amount,
          0,
          "Justin NFT amount value should be 0 because its transfered to admin ATA"
        );
        console.log("Justin NFT amount:", parsed.info.tokenAmount.amount);
      }
    });
  });
});
