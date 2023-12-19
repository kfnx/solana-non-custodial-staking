#!/bin/bash
anchor build
solana config get -C scripts/deploy_config.yml
PROGRAM_ADDRESS=$(solana address -k ./target/deploy/nc_staking-keypair.json)
CURRENT_BALANCE=$(solana balance -C scripts/deploy_config.yml)
echo 💵 You have $CURRENT_BALANCE in the signer wallet.

# confirmation prompt
read -p "Are you sure you want to deploy to $PROGRAM_ADDRESS with the config above? " -n 1 -r
echo # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]; then
    solana program deploy -C $(dirname $0)/deploy_config.yml --program-id ./target/deploy/nc_staking-keypair.json ./target/deploy/nc_staking.so

    NEW_BALANCE=$(solana balance -C scripts/deploy_config.yml)
    echo 💵 You have $NEW_BALANCE in the signer wallet.
fi

# if deploy fails, rerun with recovered buffer key
# solana program deploy -C $(dirname $0)/deploy_config.yml --buffer buffer.json --program-id ./target/deploy/nc_staking-keypair.json ./target/deploy/nc_staking.so
