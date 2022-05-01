import { describe, before } from "mocha";
import { assert } from "chai";
import * as anchor from "@project-serum/anchor";
import { NcStaking } from "../target/types/nc_staking";
import { createUser, User } from "./utils/user";
import { findVaultPDA } from "./utils/pda";

const { SystemProgram } = anchor.web3;

let justin: User;
let markers: User;

before((done) => {
  createUser().then((user) => {
    justin = user;
    createUser().then((user) => {
      markers = user;
      done();
    });
  });
});

const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;

describe("Good user Justin exist", async () => {
  it("User Created", () => {
    console.log("  address", justin.keypair.publicKey.toBase58());
  });

  it("Justin initate a staking vault", async () => {
    const [vault, _vaultBump] = await findVaultPDA(
      justin.wallet,
      program.programId
    );

    await program.methods
      .initStakingVault()
      .accounts({
        vault: vault,
        user: justin.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([justin.keypair])
      .rpc();

    const account = await program.account.vault.fetch(vault);
    assert.ok(account.user.equals(justin.wallet.publicKey));
    assert.ok(account.totalStaked.toNumber() === 0);
  });

  it("Justin cannot create vault more than once", async () => {
    const [vault, _vaultBump] = await findVaultPDA(
      justin.wallet,
      program.programId
    );

    try {
      await program.methods
        .initStakingVault()
        .accounts({
          vault: vault,
          user: justin.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([justin.keypair])
        .rpc();

      assert.fail("Cannot initiate same vault");
    } catch (error) {}
  });

  it("Justin stake one of his NFT", async () => {
    const [vault, _vaultBump] = await findVaultPDA(
      justin.wallet,
      program.programId
    );

    await program.methods
      .stake()
      .accounts({
        vault: vault,
        user: justin.wallet.publicKey,
      })
      .signers([justin.keypair])
      .rpc();

    const account = await program.account.vault.fetch(vault);

    assert.ok(account.user.equals(justin.wallet.publicKey));
    assert.ok(account.totalStaked.toNumber() === 1);
  });

  it("Justin stake another NFT (now 2)", async () => {
    const [vault, _vaultBump] = await findVaultPDA(
      justin.wallet,
      program.programId
    );

    await program.methods
      .stake()
      .accounts({
        vault: vault,
        user: justin.wallet.publicKey,
      })
      .signers([justin.keypair])
      .rpc();

    const account = await program.account.vault.fetch(vault);

    assert.ok(account.user.equals(justin.wallet.publicKey));
    assert.ok(account.totalStaked.toNumber() === 2);
  });

  it("Justin unstake one of his NFT", async () => {
    const [vault, _vaultBump] = await findVaultPDA(
      justin.wallet,
      program.programId
    );
    await program.methods
      .unstake()
      .accounts({
        vault: vault,
        user: justin.wallet.publicKey,
      })
      .signers([justin.keypair])
      .rpc();

    const account = await program.account.vault.fetch(vault);

    assert.ok(account.user.equals(justin.wallet.publicKey));
    assert.ok(account.totalStaked.toNumber() === 1);
  });
});

describe("Bad user Markers try staking program", () => {
  it("User Created", () => {
    console.log("  address", markers.keypair.publicKey.toBase58());
  });

  it("Markers initate a staking vault", async () => {
    const [vault, _vaultBump] = await findVaultPDA(
      markers.wallet,
      program.programId
    );

    await program.methods
      .initStakingVault()
      .accounts({
        vault: vault,
        user: markers.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([markers.keypair])
      .rpc();

    const account = await program.account.vault.fetch(vault);
    assert.ok(account.user.equals(markers.wallet.publicKey));
    assert.ok(account.totalStaked.toNumber() === 0);
  });

  it("Markers cannot unstake empty vault", async () => {
    try {
      const [vault, _] = await findVaultPDA(markers.wallet, program.programId);

      await program.methods
        .unstake()
        .accounts({
          vault: vault,
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
      const [markersVault, _] = await findVaultPDA(
        markers.wallet,
        program.programId
      );

      await program.methods
        .initStakingVault()
        .accounts({
          vault: markersVault,
          user: markers.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([markers.keypair])
        .rpc();

      // but modify (stake to) other user vault
      const [userOneVault, __] = await findVaultPDA(
        justin.wallet,
        program.programId
      );
      await program.methods
        .stake()
        .accounts({
          vault: userOneVault,
          user: markers.wallet.publicKey,
        })
        .signers([markers.keypair])
        .rpc();

      assert.fail(
        "Method should have failed. Cannot modify other user vault if not the owner."
      );
    } catch (error) {
      const [jhonVault, _vaultBump] = await findVaultPDA(
        justin.wallet,
        program.programId
      );
      const vaultState = await program.account.vault.fetch(jhonVault);
      assert.equal(vaultState.totalStaked.toNumber(), 1);
    }
  });
});

describe("Final program state", () => {
  it("Fetch all 2 user (Justin and Markers)", async () => {
    const allStakingAccounts = await program.account.vault.all();

    assert.equal(allStakingAccounts.length, 2);
  });
});
