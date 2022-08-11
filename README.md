Non custodial staking program

program id: `stakEUMMv9bRHYX4CyVY48i19ViBdNSzn8Rt1a1Fi6E`

<br/>
<p align="center">
  <img 
    src="https://cdn.discordapp.com/attachments/897388963671736340/984288487551422554/Screenshot_2022-06-09_at_09.50.45.png"
  />
  Program Instructions
</p>
<br/>
<p align="center">
  <img 
    src="https://cdn.discordapp.com/attachments/897388963671736340/989452987724357682/Screenshot_2022-06-23_at_15.51.41.png"
  />
  Staking reward calculation
</p>
<br/>

## Getting started

- Install all the toolchain, for quick guide check out [anchor istallation](https://project-serum.github.io/anchor/getting-started/installation.html#install-rust)
  - Rust 1.60.x
  - Anchor 0.24.2
  - NodeJS 16.x
  - Yarn 1.22.x
- Recomended if you use vscode: [Rust official vscode extension](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust)
- Install node_modules with `yarn`
- Update anchor provider.wallet on `Anchor.toml` file with the path to your [keypair](https://docs.solana.com/wallet-guide/file-system-wallet#generate-a-file-system-wallet-keypair). You can check your keypair path with running `yarn keypair`

## Commands

- Build solana program with `anchor build`
- Deploy solana program with `anchor deploy`, double check your Anchor.toml config and solana balance before continue
- Test solana program with `anchor test`
- Run solana local cluster with `solana-test-validator`, this is useful for development with fast network speed with of repetition and less strict environtment
- Run test in started local cluster with `anchor test --skip-local-validator`, this is useful to test with persistent network
- Upgrade command `anchor upgrade target/deploy/nc_staking.so --provider.cluster https://bitter-twilight-night.solana-mainnet.quiknode.pro/386d6ff7459b7d27a96b41c0b382ec26dd0b1c91/ --provider.wallet ../TWMtQV3hzKLRpDy67QPcEqkFc6r8vAwxx5UvQ3fkjh5.json --program-id stakEUMMv9bRHYX4CyVY48i19ViBdNSzn8Rt1a1Fi6E`

## Deploy your own program

To deploy with original program id, you need the original keypair. If you dont have it you can generate new keypair and deploy the program with the new keypair. Follow steps below

- Run `yarn setup:programid`. it will build the program with new keypair.
- Run `anchor test` to test the built program

## Frontend App

Currently we have two web app that interact with this contract:

- [Admin](app/admin/README.md): For Admin or Stake manager to create staking configuration, monitor stakers and other statistics.
- [Tatsumeeko Staking Page](https://github.com/tatsuworks/tm-web/blob/dev/pages/meekolony/stake/index.tsx): Tatsumeeko customer facing staking app

## Typescript SDK

We use [solita](https://github.com/metaplex-foundation/solita) to generate ts SDK to be consumed by frontend web client

- Run `yarn solita` to and sdk folder will be generated at `app/admin/sdk/` to be used by admin web app.
- modify `.solitarc` sdk output dir and re-run yarn solita to change generated sdk output for another use case.
*the generated files is not really useful, but lets see.

## Misc cli commands

spl-token transfer --fund-recipient --allow-unfunded-recipient BE9eZ6WSzKekD4pEgkoi3vud1BN1SjgrfsEe8DMQr5Hs 1 tSTW5PWzjDYCjeYEqpZg92PyRv7R733YPx9Diz6BUWr

### Github Actions

- Github action will check for build, lint and format.
- If making changes on an open Pull Request, convert it to draft so that the CI does not continuously run for each commit
