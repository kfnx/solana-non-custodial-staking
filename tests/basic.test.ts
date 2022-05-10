import { assert } from "chai";
import * as anchor from "@project-serum/anchor";
import { NcStaking } from "../target/types/nc_staking";
import { delay, findUserStatePDA, airdropUser, createUser } from "./utils";

describe("Basic user journey", () => {
  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
  let justin = createUser();
  let markers = createUser();

  describe("Good user Justin exist", () => {
    it("User created", async () => {
      console.log("    Justin address", justin.keypair.publicKey.toBase58());
      await airdropUser(justin.wallet.publicKey);
    });

    it("Justin initate staking", async () => {
      const [userState, _vaultBump] = await findUserStatePDA(
        justin.wallet.publicKey,
        program.programId
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

    it("Justin cannot create vault more than once", async () => {
      const [userState, _vaultBump] = await findUserStatePDA(
        justin.wallet.publicKey,
        program.programId
      );

      try {
        await program.methods
          .initStaking()
          .accounts({
            userState,
            user: justin.wallet.publicKey,
          })
          .signers([justin.keypair])
          .rpc();

        assert.fail("Cannot initiate same vault");
      } catch (error) {}
    });

    it("Justin stake one of his NFT", async () => {
      const [userState, _vaultBump] = await findUserStatePDA(
        justin.wallet.publicKey,
        program.programId
      );

      await program.methods
        .stake()
        .accounts({
          userState,
          user: justin.wallet.publicKey,
        })
        .signers([justin.keypair])
        .rpc();

      const account = await program.account.user.fetch(userState);

      assert.ok(account.user.equals(justin.wallet.publicKey));
      assert.ok(account.nftsStaked.toNumber() === 1);
    });

    it("Justin stake another NFT (now 2)", async () => {
      await delay(1000);
      const [userState, _vaultBump] = await findUserStatePDA(
        justin.wallet.publicKey,
        program.programId
      );

      await program.methods
        .stake()
        .accounts({
          userState,
          user: justin.wallet.publicKey,
        })
        .signers([justin.keypair])
        .rpc();

      const account = await program.account.user.fetch(userState);

      assert.ok(account.user.equals(justin.wallet.publicKey));
      assert.ok(account.nftsStaked.toNumber() === 2);
    });

    it("Justin unstake one of his NFT", async () => {
      const [userState, _vaultBump] = await findUserStatePDA(
        justin.wallet.publicKey,
        program.programId
      );
      await program.methods
        .unstake()
        .accounts({
          userState,
          user: justin.wallet.publicKey,
        })
        .signers([justin.keypair])
        .rpc();

      const account = await program.account.user.fetch(userState);

      assert.ok(account.user.equals(justin.wallet.publicKey));
      assert.ok(account.nftsStaked.toNumber() === 1);
    });
  });

  describe("Bad user Markers try staking program", () => {
    it("User Created", async () => {
      console.log("    Markers address", markers.keypair.publicKey.toBase58());
      await airdropUser(markers.wallet.publicKey);
    });

    it("Markers initate staking", async () => {
      const [userState, _vaultBump] = await findUserStatePDA(
        markers.wallet.publicKey,
        program.programId
      );

      await program.methods
        .initStaking()
        .accounts({
          userState,
          user: markers.wallet.publicKey,
        })
        .signers([markers.keypair])
        .rpc();

      const account = await program.account.user.fetch(userState);
      assert.ok(account.user.equals(markers.wallet.publicKey));
      assert.ok(account.nftsStaked.toNumber() === 0);
    });

    it("Markers cannot unstake empty vault", async () => {
      try {
        const [userState, _] = await findUserStatePDA(
          markers.wallet.publicKey,
          program.programId
        );

        await program.methods
          .unstake()
          .accounts({
            userState,
            user: markers.wallet.publicKey,
          })
          .signers([markers.keypair])
          .rpc();

        assert.fail(
          "Method should have failed. Cannot unstake anything if you have empty vault."
        );
      } catch (error) {}
    });

    it("Markers cannot modify Justin vault", async () => {
      try {
        const [markersState, _] = await findUserStatePDA(
          markers.wallet.publicKey,
          program.programId
        );

        await program.methods
          .initStaking()
          .accounts({
            userState: markersState,
            user: markers.wallet.publicKey,
          })
          .signers([markers.keypair])
          .rpc();

        // but modify (stake to) other user vault
        const [justinState, __] = await findUserStatePDA(
          justin.wallet.publicKey,
          program.programId
        );
        await program.methods
          .stake()
          .accounts({
            userState: justinState,
            user: markers.wallet.publicKey,
          })
          .signers([markers.keypair])
          .rpc();

        assert.fail(
          "Method should have failed. Cannot modify other user vault if not the owner."
        );
      } catch (error) {
        const [justinState, _vaultBump] = await findUserStatePDA(
          justin.wallet.publicKey,
          program.programId
        );
        const vaultState = await program.account.user.fetch(justinState);
        assert.equal(vaultState.nftsStaked.toNumber(), 1);
      }
    });
  });

  describe("Final program state", () => {
    it("Fetch all 2 user (Justin and Markers)", async () => {
      const allStakingAccounts = await program.account.user.all();

      assert.equal(allStakingAccounts.length, 2);
    });
  });
});
