Non custodial staking program

program id: `stakEUMMv9bRHYX4CyVY48i19ViBdNSzn8Rt1a1Fi6E`

# Getting started

- Install all the toolchain, for quick guide check out [anchor istallation](https://project-serum.github.io/anchor/getting-started/installation.html#install-rust)
  - Rust 1.60.x
  - Anchor 0.24.x
  - NodeJS 16.x
  - Yarn 1.22.x
- Recomended if you use vscode: [Rust official vscode extension](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust)
- Install node_modules with `yarn`
- Update anchor provider.wallet on `Anchor.toml` file with the path to your [keypair](https://docs.solana.com/wallet-guide/file-system-wallet#generate-a-file-system-wallet-keypair) and other configuration like cluster if necessary

# Commands

- Build solana program with `anchor build`
- Deploy solana program with `anchor deploy`
- Test solana program with `anchor test`
- Run solana local cluster with `solana-test-validator`, this is useful for development with fast network speed with of repetition and less strict environtment
- Run test in started local cluster with `anchor test --skip-local-validator`, this is useful to test with persistent network

# Deploy or developing program

To deploy with original program id, you need the original keypair. If you dont have it you can generate new keypair and deploy the program with the new keypair. Follow steps below

- Run `yarn setup:programid`. it will execute `scripts/update_program_id.sh`. it will build the set new keypair.
- Run `yarn programid` to print the new program address.
- Run `anchor test` to test the built program

