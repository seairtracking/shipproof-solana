# ShipProof — Encode Solana Hackathon 2026

## One-line pitch

ShipProof turns a shipping milestone into a public, independently verifiable Solana devnet receipt while keeping the shipment reference and evidence reference off-chain.

## The problem

Shipment status pages can be edited after the fact, and screenshots are difficult to verify independently. When a carrier, sender, and recipient disagree about a handoff, they need a shared receipt tied to a specific event.

## The product

The sender enters a test shipment reference, selects a milestone, and optionally adds an evidence reference and public note. ShipProof hashes the references locally using SHA-256. A Phantom wallet signs a Solana Memo transaction carrying the hashes, milestone, note, and sender-declared timestamp. Anyone can paste its transaction signature into ShipProof to retrieve the on-chain memo and compare the hash of a supplied shipment reference. The app also links to Solana Explorer for independent inspection.

## Why Solana

Solana provides a public transaction signature, signer, confirmed slot, and durable transaction record that neither participant needs to host or trust. The Memo program lets this prototype record a compact receipt without deploying a custom contract. The demo uses devnet and test shipment data only.

## Current implementation

- Static, mobile-responsive web app hosted with GitHub Pages.
- Phantom wallet connection and devnet Memo transaction creation.
- Independent receipt verification through Solana devnet RPC, without a wallet.
- Local SHA-256 hashing of shipment and optional evidence references.
- Automated tests for proof encoding and matching, plus a static production build.

## Links

- Live demo: https://seairtracking.github.io/shipproof-solana/
- Public source: https://github.com/seairtracking/shipproof-solana
- Real devnet receipt: https://explorer.solana.com/tx/22qC32Z9xwwVTBGaH8xYtfGNCn7iP1i3npHzhaD5Btv9zyQeXrPH5t7Tu4U1LcwmgCaugyeaRdRopw7kw2Q6sGUE?cluster=devnet
- Demo shipment reference: `DEMO-TP-2026-001`

## Limits and roadmap

The signer proves that a wallet submitted a claim; it does not establish that the wallet is an authorized carrier or that the physical shipment event occurred. Low-entropy shipment IDs can be guessed from hashes. Public notes must not contain confidential information. A production version would require verified carrier identities, event authorization, stronger privacy, and integration with TrackingPort shipment events.

## Demo video outline (2–4 minutes)

1. Show the problem and the live ShipProof page (0:00–0:30).
2. Enter a test shipment reference and milestone; explain what is hashed and what is public (0:30–1:15).
3. Connect a Phantom devnet wallet, create a proof, and open its signature in Explorer (1:15–2:10).
4. Paste the signature into Verify receipt; show a matching reference and then a nonmatching reference (2:10–3:00).
5. Point to the public repository and explain the current trust boundary and next step (3:00–3:30).
