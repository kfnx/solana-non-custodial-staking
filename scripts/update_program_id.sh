echo 🧹 clearing old build file, setting up local program configuration..
rm -rf target/

echo ⌛️ running anchor build to generate new program keypair..
anchor build
echo ✅ anchor build finish

new_program_id=`solana-keygen pubkey ./target/deploy/nc_staking-keypair.json`
sed -i'.original' "s/declare_id.*/declare_id\!\(\"$new_program_id\"\);/g" ./programs/nc-staking/src/lib.rs
echo ✅ program id replaced, rebuilding anchor with new program id..
anchor build

echo ✅ setup finished. you can start deploying your own program
echo 🔑 new program id: $new_program_id
