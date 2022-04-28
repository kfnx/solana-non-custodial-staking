import assert from "assert";
import * as anchor from "@project-serum/anchor";
import { NcStaking } from "../target/types/nc_staking";
import { PublicKey } from "@solana/web3.js";
import { Wallet } from "@project-serum/anchor/dist/cjs/provider";

const { SystemProgram } = anchor.web3;

describe("basic test", () => {
  const provider = anchor.AnchorProvider.env();
  console.log("rpc endpoint", provider.connection.rpcEndpoint);
  anchor.setProvider(provider);
  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
  console.log("program id", program.programId.toBase58());
  const user = provider.wallet;
  console.log("user", user.publicKey.toBase58());

  const findVaultPDA = async (user: Wallet | anchor.web3.Keypair) => {
    return await PublicKey.findProgramAddress(
      [Buffer.from("vault"), user.publicKey.toBytes()],
      program.programId
    );
  };

  it("Creates staking account in a single atomic transaction (simplified)", async () => {
    const [vault, _vaultBump] = await findVaultPDA(user);
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
    const [vault, _vaultBump] = await findVaultPDA(user);
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
    const [vault, _vaultBump] = await findVaultPDA(user);
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
    const [vault, _vaultBump] = await findVaultPDA(user);
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
    const anotherUser = anchor.web3.Keypair.generate();
    const [anotherUserVault, _bump] = await findVaultPDA(anotherUser);
    console.log("another user vault", anotherUserVault.toBase58());
    const airdropSig = await program.provider.connection.requestAirdrop(
      anotherUser.publicKey,
      1000000000
    );
    await program.provider.connection.confirmTransaction(airdropSig);
    console.log("another user", user.publicKey.toBase58());

    await program.methods
      .initStakingVault()
      .accounts({
        vault: anotherUserVault,
        owner: anotherUser.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([anotherUser, anotherUser])
      .rpc();

    const account = await program.account.vault.fetch(anotherUserVault);

    assert.ok(account.owner.equals(anotherUser.publicKey));
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
      const [userTwoVault, _] = await findVaultPDA(userTwo);
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
      const [userOneVault, __] = await findVaultPDA(user);
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
      const [vault, _vaultBump] = await findVaultPDA(user);
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
