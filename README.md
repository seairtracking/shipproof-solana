# ShipProof

ShipProof is a Solana devnet prototype for recording and verifying shipment milestones. The shipment reference and optional evidence reference are SHA-256 hashed locally. A wallet signs a Solana Memo transaction containing those hashes, a public milestone, a public note, and a timestamp. A verifier can retrieve the transaction and compare a supplied shipment reference to its stored hash.

Live demo: https://seairtracking.github.io/shipproof-solana/  
Hackathon write-up and video outline: [SUBMISSION.md](./SUBMISSION.md)

## Run locally

Requires Node.js 20+ and npm. No install step is needed. The browser loads the pinned Solana SDK module from esm.sh, so an internet connection is required.

```bash
npm run dev
```

Open the local URL printed by the server. To create a proof, use Phantom Wallet switched to **Solana devnet** and funded with a small amount of devnet SOL. Devnet SOL has no monetary value. The verify flow needs no wallet.

`npm run build` creates a deployable `dist/` directory. Host those files on any static HTTPS server at the domain root.

## How to demo

For a wallet-free demo, open **Verify receipt** and click **Try a real devnet receipt**. The app loads a confirmed transaction and verifies the test reference `DEMO-TP-2026-001` against its on-chain hash.

Sample signature: `22qC32Z9xwwVTBGaH8xYtfGNCn7iP1i3npHzhaD5Btv9zyQeXrPH5t7Tu4U1LcwmgCaugyeaRdRopw7kw2Q6sGUE` ([Solana Explorer](https://explorer.solana.com/tx/22qC32Z9xwwVTBGaH8xYtfGNCn7iP1i3npHzhaD5Btv9zyQeXrPH5t7Tu4U1LcwmgCaugyeaRdRopw7kw2Q6sGUE?cluster=devnet)), confirmed in devnet slot 511615216.

To create another proof:

1. Connect a Phantom wallet on Solana devnet.
2. Enter a shipment reference and milestone, then create the proof.
3. Open the result in Solana Explorer and copy the transaction signature.
4. Open **Verify receipt**, paste the signature, and enter the same shipment reference. The app checks the devnet transaction and hash match.

Only create proofs for test shipments. The milestone, note, hash, timestamp, and signer are public on-chain. The timestamp is declared by the sender; transaction confirmation and slot are supplied by Solana. A hash of a low-entropy shipment ID may be guessable, so this prototype does not guarantee anonymity. No private keys are stored by the app.

## Technical design

- Solana devnet RPC: `https://api.devnet.solana.com`
- Solana Memo program: `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`
- Memo format: `SHIPPROOF_V1:` followed by JSON
- Wallet: Phantom injected provider for signing and sending a transaction
- Verification: `getParsedTransaction` checks successful confirmation and Memo program ID, then parses the proof
- No server, database, or wallet custody

## Current status

The UI and proof logic are implemented and tested locally. A real devnet sample receipt has been submitted and independently read back from Solana RPC. Creating new proofs through the browser requires a connected Phantom wallet with devnet SOL. This is a prototype for the Encode Solana Hackathon 2026, not a production shipment attestation service. Future work: authorized carrier identities, signature policies, stronger privacy, dispute handling, and real TrackingPort shipment events.

## License

MIT
