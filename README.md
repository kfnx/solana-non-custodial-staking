Non custodial staking program

# Getting started

- Install all the toolchain, for quick guide check out [anchor istallation](https://project-serum.github.io/anchor/getting-started/installation.html#install-rust)
  - Rust 1.60.x
  - Anchor 0.24.x
  - NodeJS 16.x
  - Yarn 1.22.x
- Recomended if you use vscode: [Rust official vscode extension](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust)
- Install node_modules with `yarn`
- Update anchor provider.wallet on `Anchor.toml` file with the path to your [keypair](https://docs.solana.com/wallet-guide/file-system-wallet#generate-a-file-system-wallet-keypair)
- Build solana program with `anchor build`
- Run `anchor deploy`. 
- Run `anchor test` to check and learn the program instruction example