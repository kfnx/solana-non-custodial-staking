import assert from "assert";
import * as anchor from "@project-serum/anchor";
import { NcStaking } from "../target/types/nc_staking";

const { SystemProgram } = anchor.web3;

describe("basic test", () => {
  const provider = anchor.AnchorProvider.env();
  console.log("rpc endpoint", provider.connection.rpcEndpoint);

  anchor.setProvider(provider);

  let testAcc: anchor.web3.Keypair;

  it("Creates staking account in a single atomic transaction (simplified)", async () => {
    const program = anchor.workspace.NcStaking as anchor.Program<NcStaking>;
    console.log("program id", program.programId.toBase58());

    const stakingAccount = anchor.web3.Keypair.generate();
    console.log("stakingAccount", stakingAccount.publicKey.toBase58());
    const user = provider.wallet;
    console.log("user", user.publicKey.toBase58());

    const jsonData = { data: "yummy steak!", total: 12 };

    await program.rpc.initStakingAcc(JSON.stringify(jsonData), {
      accounts: {
        account: stakingAccount.publicKey,
        owner: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [stakingAccount],
    });

    const account = await program.account.stakingAccount.fetch(
      stakingAccount.publicKey
    );
    console.log("account", account);

    assert.equal(account.owner.toBase58(), user.publicKey.toBase58());

    // Store the account for the next test.
    testAcc = stakingAccount;
  });
});
