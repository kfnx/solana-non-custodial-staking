import assert from "assert";
import * as anchor from "@project-serum/anchor";
import { NcStaking } from "../target/types/nc_staking";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createUser, findVaultPDA } from "./utils";

const { SystemProgram } = anchor.web3;

describe("basic test", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
  const { programId } = program;
  const user = provider.wallet;

  console.log("rpc endpoint", provider.connection.rpcEndpoint);
  console.log("program id", programId.toBase58());

  it("Creates staking account in a single atomic transaction (simplified)", async () => {
    const [vault, _vaultBump] = await findVaultPDA(user, programId);

    await program.methods
      .initStakingVault()
      .accounts({
        vault: vault,
        user: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const account = await program.account.vault.fetch(vault);
    assert.ok(account.user.equals(user.publicKey));
    assert.ok(account.totalStaked.toNumber() === 0);
  });

  it("Cannot create same vault more than once", async () => {
    const [vault, _vaultBump] = await findVaultPDA(user, programId);

    try {
      await program.methods
        .initStakingVault()
        .accounts({
          vault: vault,
          user: user.publicKey,
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
        user: user.publicKey,
      })
      .rpc();

    const account = await program.account.vault.fetch(vault);

    assert.ok(account.user.equals(user.publicKey));
    assert.ok(account.totalStaked.toNumber() === 1);
  });

  it("Unstake recording reduce 1 NFT", async () => {
    const [vault, _vaultBump] = await findVaultPDA(user, programId);
    await program.methods
      .unstake()
      .accounts({
        vault: vault,
        user: user.publicKey,
      })
      .rpc();

    const account = await program.account.vault.fetch(vault);

    assert.ok(account.user.equals(user.publicKey));
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
        user: userKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([userKeypair])
      .rpc();

    const account = await program.account.vault.fetch(anotherUserVault);

    assert.ok(account.user.equals(userKeypair.publicKey));
    assert.ok(account.totalStaked.toNumber() === 0);
  });

  it("User cannot modify other user vault", async () => {
    const userTwo = anchor.web3.Keypair.generate();
    const airdropSig = await program.provider.connection.requestAirdrop(
      userTwo.publicKey,
      1000000000
    );
    await program.provider.connection.confirmTransaction(airdropSig);

    try {
      // init his own vault
      const [userTwoVault, _] = await findVaultPDA(userTwo, programId);

      await program.methods
        .initStakingVault()
        .accounts({
          vault: userTwoVault,
          user: userTwo.publicKey,
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
          user: userTwo.publicKey,
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

    // 3 staking account created from overall test
    assert.equal(allStakingAccounts.length, 3);
  });
});
