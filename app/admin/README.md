This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Running Localhost solana node

Its more convenient to run an anchor test and keep the node running after test so we can see the test accounts on the frontend by running command:

```bash
anchor test --provider.wallet /path/to/your/local/keypair.json --detach
```
