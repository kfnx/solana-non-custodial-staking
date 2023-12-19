# echo 🧹 clearing old build file, setting up local program configuration..
# rm -rf target/

# echo ⌛️ running anchor build to generate new program keypair..
# anchor build
# echo ✅ anchor build finish

# new_program_id=`solana-keygen pubkey ./target/deploy/nc_staking-keypair.json`
new_program_id=`solana address -k ./target/deploy/nc_staking-keypair.json`
echo Current Program ID: $new_program_id
cp ./target/deploy/nc_staking-keypair.json ~/$new_program_id.json
sed -i'.original' "s/declare_id.*/declare_id\!\(\"$new_program_id\"\);/g" ./programs/nc-staking/src/lib.rs
echo ✅ program id updated, rebuilding anchor with new program id..
echo A copy of the program keypair has been copied to your user folder
anchor build

echo ✅ setup finished. you can start deploying your own program
echo 🔑 new program id: $new_program_id
