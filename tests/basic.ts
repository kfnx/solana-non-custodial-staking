import assert from "assert";
import * as anchor from "@project-serum/anchor";
import { NcStaking } from "../target/types/nc_staking";

const { SystemProgram } = anchor.web3;

describe("basic test", () => {
  const provider = anchor.AnchorProvider.env();
  console.log("rpc endpoint", provider.connection.rpcEndpoint);
  anchor.setProvider(provider);
  const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
  console.log("program id", program.programId.toBase58());
  const stakingAccount = anchor.web3.Keypair.generate();
  console.log("staking account", stakingAccount.publicKey.toBase58());
  const user = provider.wallet;
  console.log("user", user.publicKey.toBase58());

  it("Creates staking account in a single atomic transaction (simplified)", async () => {
    const jsonData = { data: "yummy steak!", total: 12 };

    await program.rpc.initStakingAcc(JSON.stringify(jsonData), {
      accounts: {
        account: stakingAccount.publicKey,
        authority: user.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [stakingAccount],
    });

    const account = await program.account.stakingAccount.fetch(
      stakingAccount.publicKey
    );

    assert.ok(account.authority.equals(user.publicKey));
    assert.ok(account.stakedNft.toNumber() === 0);
  });

  it("Stake recording add 1 NFT", async () => {
    await program.rpc.stake({
      accounts: {
        account: stakingAccount.publicKey,
        authority: user.publicKey,
      },
    });

    const account = await program.account.stakingAccount.fetch(
      stakingAccount.publicKey
    );

    assert.ok(account.authority.equals(user.publicKey));
    assert.ok(account.stakedNft.toNumber() === 1);
  });

  it("Unstake recording reduce 1 NFT", async () => {
    await program.rpc.unstake({
      accounts: {
        account: stakingAccount.publicKey,
        authority: user.publicKey,
      },
    });

    const account = await program.account.stakingAccount.fetch(
      stakingAccount.publicKey
    );

    assert.ok(account.authority.equals(user.publicKey));
    assert.ok(account.stakedNft.toNumber() === 0);
  });

  it("Creates staking account from another user", async () => {
    const anotherStakingAccount = anchor.web3.Keypair.generate();
    console.log("another staking account", anotherStakingAccount.publicKey.toBase58());
    const anotherUser = anchor.web3.Keypair.generate();
    const airdropSig = await program.provider.connection.requestAirdrop(
      anotherUser.publicKey,
      1000000000
    );
    await program.provider.connection.confirmTransaction(airdropSig);
    console.log("another user", user.publicKey.toBase58());
    const jsonData = { data: "not yummy!", total: 100 };

    await program.rpc.initStakingAcc(JSON.stringify(jsonData), {
      accounts: {
        account: anotherStakingAccount.publicKey,
        authority: anotherUser.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [anotherStakingAccount, anotherUser],
    });

    const account = await program.account.stakingAccount.fetch(
      anotherStakingAccount.publicKey
    );

    assert.ok(account.authority.equals(anotherUser.publicKey));
    assert.ok(account.stakedNft.toNumber() === 0);
  });

  it("User cannot stake other user NFT", async () => {
    const newUser = anchor.web3.Keypair.generate();
    try {
      await program.rpc.stake({
        accounts: {
          account: stakingAccount.publicKey,
          authority: newUser.publicKey,
        },
        signers: [newUser],
      });
      assert.fail(
        "The instruction should have failed (Signature invalid). Cannot modify other user staking account from different user authority."
      );
    } catch (error) {
      // Ensure the tweet account kept the initial data.
      const stakingAccountState = await program.account.stakingAccount.fetch(
        stakingAccount.publicKey
      );
      // should stay zero
      assert.equal(stakingAccountState.stakedNft.toNumber(), 0);
    }
  });

  it("Fetch all staking accounts", async () => {
    const allStakingAccounts = await program.account.stakingAccount.all();

    // 2 staking account created from overall test
    // user (env provided keypair) and anotherUser (generated keypair)
    assert.equal(allStakingAccounts.length, 2);
  });
});
