solkeypath=`solana config get | grep "Keypair Path: " | sed "s/Keypair Path: //g"`
echo 📁 Your solana cli keypair path: $solkeypath

# TODO: fix error sed
sed -i "s/wallet.*/wallet = { read test; echo $test }" ./Anchor.toml
echo ✅ Anchor.toml wallet replaced with your local solana cli wallet
