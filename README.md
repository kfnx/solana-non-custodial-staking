Non custodial staking program

program id: `stakEUMMv9bRHYX4CyVY48i19ViBdNSzn8Rt1a1Fi6E`

# Getting started

- Install all the toolchain, for quick guide check out [anchor istallation](https://project-serum.github.io/anchor/getting-started/installation.html#install-rust)
  - Rust 1.60.x
  - Anchor 0.24.2
  - NodeJS 16.x
  - Yarn 1.22.x
- Recomended if you use vscode: [Rust official vscode extension](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust)
- Install node_modules with `yarn`
- Update anchor provider.wallet on `Anchor.toml` file with the path to your [keypair](https://docs.solana.com/wallet-guide/file-system-wallet#generate-a-file-system-wallet-keypair). You can check your keypair path with running `yarn keypair`

# Commands

- Build solana program with `anchor build`
- Deploy solana program with `anchor deploy`, double check your Anchor.toml config and solana balance before continue
- Test solana program with `anchor test`
- Run solana local cluster with `solana-test-validator`, this is useful for development with fast network speed with of repetition and less strict environtment
- Run test in started local cluster with `anchor test --skip-local-validator`, this is useful to test with persistent network

# Deploy your own program

To deploy with original program id, you need the original keypair. If you dont have it you can generate new keypair and deploy the program with the new keypair. Follow steps below

- Run `yarn setup:programid`. it will build the program with new keypair.
- Run `yarn programid` to print the new program address after setup.
- Run `anchor test` to test the built program

# Typescript SDK

We use [solita](https://github.com/metaplex-foundation/solita) to generate ts SDK to be consumed by frontend web client
- Run `yarn solita` to and sdk folder will be generated at `app/admin/sdk/` to be used by admin web app.
- modify `.solitarc` sdk output dir and re-run yarn solita to change generated sdk output for another use case.

# Misc cli commands
spl-token transfer --fund-recipient --allow-unfunded-recipient BE9eZ6WSzKekD4pEgkoi3vud1BN1SjgrfsEe8DMQr5Hs 1 tSTW5PWzjDYCjeYEqpZg92PyRv7R733YPx9Diz6BUWr