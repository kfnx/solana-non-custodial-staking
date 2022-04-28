import assert from "assert";
import * as anchor from "@project-serum/anchor";
import { NcStaking } from "../target/types/nc_staking";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createUser, findVaultPDA } from "./utils";

const { SystemProgram } = anchor.web3;

describe("basic test", () => {
  const provider = anchor.AnchorProvider.env();
  console.log("rpc endpoint", provider.connection.rpcEndpoint);
  anchor.setProvider(provider);
  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
  const { programId } = program;
  console.log("program id", programId.toBase58());
  const user = provider.wallet;
  console.log("user", user.publicKey.toBase58());

  it("Creates staking account in a single atomic transaction (simplified)", async () => {
    const [vault, _vaultBump] = await findVaultPDA(user, programId);
    console.log("vault", vault.toBase58());

    await program.methods
      .initStakingVault()
      .accounts({
        vault: vault,
        owner: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const account = await program.account.vault.fetch(vault);
    assert.ok(account.owner.equals(user.publicKey));
    assert.ok(account.totalStaked.toNumber() === 0);
  });

  it("Cannot create same vault more than once", async () => {
    const [vault, _vaultBump] = await findVaultPDA(user, programId);
    console.log("vault", vault.toBase58());

    try {
      await program.methods
        .initStakingVault()
        .accounts({
          vault: vault,
          owner: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      assert.fail("Cannot initiate same vault");
    } catch (error) {}
  });

  it("Stake recording add 1 NFT", async () => {
    const [vault, _vaultBump] = await findVaultPDA(user, programId);
    await program.methods
      .stake()
      .accounts({
        vault: vault,
        owner: user.publicKey,
      })
      .rpc();

    const account = await program.account.vault.fetch(vault);

    assert.ok(account.owner.equals(user.publicKey));
    assert.ok(account.totalStaked.toNumber() === 1);
  });

  it("Unstake recording reduce 1 NFT", async () => {
    const [vault, _vaultBump] = await findVaultPDA(user, programId);
    await program.methods
      .unstake()
      .accounts({
        vault: vault,
        owner: user.publicKey,
      })
      .rpc();

    const account = await program.account.vault.fetch(vault);

    assert.ok(account.owner.equals(user.publicKey));
    assert.ok(account.totalStaked.toNumber() === 0);
  });

  it("Creates vault account from generated user", async () => {
    const { key: userKeypair } = await createUser(
      provider,
      1 * LAMPORTS_PER_SOL
    );
    const [anotherUserVault, _bump] = await findVaultPDA(
      userKeypair,
      programId
    );

    await program.methods
      .initStakingVault()
      .accounts({
        vault: anotherUserVault,
        owner: userKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([userKeypair])
      .rpc();

    const account = await program.account.vault.fetch(anotherUserVault);

    assert.ok(account.owner.equals(userKeypair.publicKey));
    assert.ok(account.totalStaked.toNumber() === 0);
  });

  it("User cannot modify other user vault", async () => {
    const userTwo = anchor.web3.Keypair.generate();
    console.log("userTwo", userTwo.publicKey.toBase58());
    const airdropSig = await program.provider.connection.requestAirdrop(
      userTwo.publicKey,
      1000000000
    );
    await program.provider.connection.confirmTransaction(airdropSig);

    try {
      // init his own vault
      const [userTwoVault, _] = await findVaultPDA(userTwo, programId);
      console.log("userTwoVault", userTwoVault.toBase58());

      await program.methods
        .initStakingVault()
        .accounts({
          vault: userTwoVault,
          owner: userTwo.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([userTwo])
        .rpc();

      // but modify (stake to) other user vault
      const [userOneVault, __] = await findVaultPDA(user, programId);
      await program.methods
        .stake()
        .accounts({
          vault: userOneVault,
          owner: userTwo.publicKey,
        })
        .rpc();

      assert.fail(
        "Method should have failed. Cannot modify other user vault if not the owner."
      );
    } catch (error) {
      // targeted vault should stay zero
      const [vault, _vaultBump] = await findVaultPDA(user, programId);
      const vaultState = await program.account.vault.fetch(vault);
      assert.equal(vaultState.totalStaked.toNumber(), 0);
    }
  });

  it("Fetch all staking accounts", async () => {
    const allStakingAccounts = await program.account.vault.all();

    // 2 staking account created from overall test
    // user (env provided keypair) and anotherUser (generated keypair)
    assert.equal(allStakingAccounts.length, 3);
  });
});
