import { describe, before } from "mocha";
import { assert } from "chai";
import * as anchor from "@project-serum/anchor";
import { NcStaking } from "../target/types/nc_staking";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createUser, findVaultPDA, User } from "./utils";

const { SystemProgram } = anchor.web3;

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;

console.log("rpc endpoint", provider.connection.rpcEndpoint);
console.log("program id", program.programId.toBase58());

let jhon: User;
let markers: User;

before((done) => {
  createUser(provider, 1 * LAMPORTS_PER_SOL).then((user) => {
    jhon = user;
    createUser(provider, 1 * LAMPORTS_PER_SOL).then((user) => {
      markers = user;
      done();
    });
  });
});

describe("Good user Jhon exist", () => {
  it("Jhon initate a staking vault", async () => {
    const [vault, _vaultBump] = await findVaultPDA(
      jhon.wallet,
      program.programId
    );

    await program.methods
      .initStakingVault()
      .accounts({
        vault: vault,
        user: jhon.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([jhon.keypair])
      .rpc();

    const account = await program.account.vault.fetch(vault);
    assert.ok(account.user.equals(jhon.wallet.publicKey));
    assert.ok(account.totalStaked.toNumber() === 0);
  });

  it("Jhon cannot create vault more than once", async () => {
    const [vault, _vaultBump] = await findVaultPDA(
      jhon.wallet,
      program.programId
    );

    try {
      await program.methods
        .initStakingVault()
        .accounts({
          vault: vault,
          user: jhon.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([jhon.keypair])
        .rpc();

      assert.fail("Cannot initiate same vault");
    } catch (error) {}
  });

  it("Jhon stake one of his NFT", async () => {
    const [vault, _vaultBump] = await findVaultPDA(
      jhon.wallet,
      program.programId
    );

    await program.methods
      .stake()
      .accounts({
        vault: vault,
        user: jhon.wallet.publicKey,
      })
      .signers([jhon.keypair])
      .rpc();

    const account = await program.account.vault.fetch(vault);

    assert.ok(account.user.equals(jhon.wallet.publicKey));
    assert.ok(account.totalStaked.toNumber() === 1);
  });

  it("Jhon stake another NFT (now 2)", async () => {
    const [vault, _vaultBump] = await findVaultPDA(
      jhon.wallet,
      program.programId
    );

    await program.methods
      .stake()
      .accounts({
        vault: vault,
        user: jhon.wallet.publicKey,
      })
      .signers([jhon.keypair])
      .rpc();

    const account = await program.account.vault.fetch(vault);

    assert.ok(account.user.equals(jhon.wallet.publicKey));
    assert.ok(account.totalStaked.toNumber() === 2);
  });

  it("Jhon unstake one of his NFT", async () => {
    const [vault, _vaultBump] = await findVaultPDA(
      jhon.wallet,
      program.programId
    );
    await program.methods
      .unstake()
      .accounts({
        vault: vault,
        user: jhon.wallet.publicKey,
      })
      .signers([jhon.keypair])
      .rpc();

    const account = await program.account.vault.fetch(vault);

    assert.ok(account.user.equals(jhon.wallet.publicKey));
    assert.ok(account.totalStaked.toNumber() === 1);
  });
});

describe("Bad user Markers try staking program", () => {
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

  it("Markers cannot modify Jhon vault", async () => {
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
        jhon.wallet,
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
        jhon.wallet,
        program.programId
      );
      const vaultState = await program.account.vault.fetch(jhonVault);
      assert.equal(vaultState.totalStaked.toNumber(), 1);
    }
  });
});

describe("Final program state", () => {
  it("Fetch all 2 user (Jhon and Markers)", async () => {
    const allStakingAccounts = await program.account.vault.all();

    assert.equal(allStakingAccounts.length, 2);
  });
});
