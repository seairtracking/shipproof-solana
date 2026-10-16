import { Connection, PublicKey, Transaction, TransactionInstruction } from 'https://esm.sh/@solana/web3.js@1.98.4?bundle&target=es2022';
import { buildProof, matchesShipment, MEMO_PROGRAM, parseProof } from './proof.js';

const RPC = 'https://api.devnet.solana.com';
const DEMO_SIGNATURE = '22qC32Z9xwwVTBGaH8xYtfGNCn7iP1i3npHzhaD5Btv9zyQeXrPH5t7Tu4U1LcwmgCaugyeaRdRopw7kw2Q6sGUE';
const DEMO_REFERENCE = 'DEMO-TP-2026-001';
const connection = new Connection(RPC, 'confirmed');
let wallet = null;
let walletAddress = '';
const $ = (selector) => document.querySelector(selector);

$('#app').innerHTML = `
  <header class="topbar"><a class="brand" href="./" aria-label="ShipProof home"><span class="brand-icon">↗</span><span>shipproof<span class="brand-dot">.</span></span></a><div class="network"><span class="network-dot"></span> SOLANA DEVNET</div><button id="wallet-button" class="wallet-button">Connect wallet</button></header>
  <main><section class="hero"><div class="eyebrow"><span class="eyebrow-line"></span> VERIFIABLE SHIPPING MILESTONES</div><h1>Every handoff,<br><em>provable.</em></h1><p class="hero-copy">A shipment update is easy to change. A Solana receipt is not. Create a public proof for each milestone without putting the shipment reference or evidence on-chain.</p><div class="hero-chips"><span>01 / Create a proof</span><span>02 / Sign with your wallet</span><span>03 / Share a verifiable receipt</span></div></section>
  <section class="workspace"><div class="tabbar"><button class="tab active" data-tab="create">Create proof <span>01</span></button><button class="tab" data-tab="verify">Verify receipt <span>02</span></button></div>
    <div id="create-panel" class="panel"><div class="panel-heading"><div><p class="overline">NEW MILESTONE</p><h2>Record an event</h2></div><div class="step-mark">01 / 02</div></div><p class="panel-copy">Your wallet signs a Solana devnet Memo transaction. Only hashes of your shipment reference and evidence are published; the milestone and note remain public.</p>
      <form id="create-form"><label>Shipment reference<input id="shipment" required maxlength="80" placeholder="e.g. TP-2026-001" autocomplete="off" /></label><div class="row"><label>Milestone<small aria-hidden="true">&nbsp;</small><select id="milestone"><option>Picked up</option><option>At origin port</option><option>In transit</option><option>Customs cleared</option><option>Out for delivery</option><option>Delivered</option><option>Exception reported</option></select></label><label>Evidence reference <small>optional</small><input id="evidence" maxlength="500" placeholder="Document ID or description" /></label></div><label>Public note <small>optional · visible on Solana</small><textarea id="note" maxlength="160" rows="3" placeholder="e.g. Container released at destination port"></textarea></label><div class="form-footer"><span>No private key is stored by ShipProof.</span><button class="primary" type="submit">Create on-chain proof <span>↗</span></button></div></form>
    </div>
    <div id="verify-panel" class="panel hidden"><div class="panel-heading"><div><p class="overline">RECEIPT CHECK</p><h2>Verify a milestone</h2></div><div class="step-mark">02 / 02</div></div><p class="panel-copy">Paste a Solana devnet transaction signature. Verification reads the transaction directly from Solana RPC; no wallet is needed.</p><button id="load-demo" class="secondary" type="button">Try a real devnet receipt ↗</button><form id="verify-form"><label>Transaction signature<input id="signature" required placeholder="Paste the transaction signature" autocomplete="off" /></label><label>Shipment reference <small>optional · checks the on-chain hash</small><input id="reference" maxlength="80" placeholder="e.g. TP-2026-001" autocomplete="off" /></label><div class="form-footer"><span>Data source: Solana devnet</span><button class="primary" type="submit">Verify receipt <span>↗</span></button></div></form></div>
    <div id="result" class="result hidden" role="status" aria-live="polite"></div><div id="error" class="error hidden" role="alert"></div>
  </section><section class="explainer"><div><p class="overline">HOW IT WORKS</p><h2>Trust the chain,<br>not the screenshot.</h2></div><div class="explainer-list"><p><strong>01</strong><span><b>Hash locally</b>The shipment reference and optional evidence are SHA-256 hashed in your browser.</span></p><p><strong>02</strong><span><b>Sign on devnet</b>Your wallet signs a Memo transaction. The hash, milestone, public note and timestamp become durable proof.</span></p><p><strong>03</strong><span><b>Verify independently</b>Anyone with the transaction signature can query Solana and compare a shipment reference to the stored hash.</span></p></div></section></main><footer><span>SHIPPROOF / A TRACKINGPORT EXPERIMENT</span><span>Built for Encode Solana Hackathon 2026 · Devnet demo</span></footer>`;

function showError(message) { $('#error').textContent = message; $('#error').classList.remove('hidden'); $('#result').classList.add('hidden'); }
function clearMessages() { $('#error').classList.add('hidden'); $('#result').classList.add('hidden'); }
function shortAddress(address) { return `${address.slice(0, 4)}…${address.slice(-4)}`; }
function setBusy(button, busy, idle) { button.disabled = busy; button.textContent = busy ? 'Working…' : idle; }
function switchTab(tab) { document.querySelectorAll('.tab').forEach(el => el.classList.toggle('active', el.dataset.tab === tab)); $('#create-panel').classList.toggle('hidden', tab !== 'create'); $('#verify-panel').classList.toggle('hidden', tab !== 'verify'); clearMessages(); }
document.querySelectorAll('.tab').forEach(el => el.addEventListener('click', () => switchTab(el.dataset.tab)));
$('#load-demo').addEventListener('click', () => {
  $('#signature').value = DEMO_SIGNATURE;
  $('#reference').value = DEMO_REFERENCE;
  $('#verify-form').requestSubmit($('#verify-form button[type="submit"]'));
});

async function connectWallet() {
  const provider = window.phantom?.solana || window.solana;
  if (!provider?.isPhantom) throw new Error('Install or open Phantom Wallet, then switch it to Solana devnet.');
  const response = await provider.connect();
  wallet = provider;
  walletAddress = response.publicKey.toString();
  $('#wallet-button').textContent = shortAddress(walletAddress);
  return provider;
}
$('#wallet-button').addEventListener('click', async () => { try { clearMessages(); await connectWallet(); } catch (error) { showError(error.message); } });

$('#create-form').addEventListener('submit', async (event) => {
  event.preventDefault(); clearMessages();
  const button = event.submitter; setBusy(button, true, 'Create on-chain proof ↗');
  try {
    if (!wallet) await connectWallet();
    const { memo, payload } = await buildProof({ shipment: $('#shipment').value, milestone: $('#milestone').value, note: $('#note').value, evidence: $('#evidence').value });
    const instruction = new TransactionInstruction({ keys: [], programId: new PublicKey(MEMO_PROGRAM), data: new TextEncoder().encode(memo) });
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    const transaction = new Transaction({ feePayer: new PublicKey(walletAddress), recentBlockhash: blockhash }).add(instruction);
    const signed = await wallet.signAndSendTransaction(transaction);
    const signature = signed.signature;
    const confirmation = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
    if (confirmation.value.err) throw new Error('Solana reported a failed transaction. Check it in Explorer.');
    const link = `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet`;
    $('#result').innerHTML = `<p class="overline">PROOF CONFIRMED ON DEVNET</p><h3>${escapeHtml(payload.milestone)}</h3><p>Your receipt can be checked independently. Share the signature with anyone who needs to verify this milestone.</p><div class="signature">${escapeHtml(signature)}</div><div class="result-actions"><button id="copy-signature" class="secondary">Copy signature</button><a class="secondary" href="${link}" target="_blank" rel="noopener noreferrer">View in Solana Explorer ↗</a><button id="verify-this" class="secondary">Verify this receipt</button></div>`;
    $('#result').classList.remove('hidden');
    $('#copy-signature').addEventListener('click', async () => { await navigator.clipboard.writeText(signature); $('#copy-signature').textContent = 'Copied ✓'; });
    $('#verify-this').addEventListener('click', () => { switchTab('verify'); $('#signature').value = signature; $('#reference').value = $('#shipment').value; });
  } catch (error) { showError(error.message || 'Could not create a proof.'); }
  finally { setBusy(button, false, 'Create on-chain proof ↗'); }
});

async function readMemo(signature) {
  const tx = await connection.getParsedTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
  if (!tx) throw new Error('Transaction not found on Solana devnet. Check the signature and network.');
  if (tx.meta?.err) throw new Error('The transaction failed on Solana devnet.');
  const instruction = tx.transaction.message.instructions.find(item => item.programId?.toBase58() === MEMO_PROGRAM);
  if (!instruction) throw new Error('No ShipProof memo was found in this transaction.');
  const memo = instruction.parsed;
  if (typeof memo !== 'string') throw new Error('Memo format was not recognized.');
  return { proof: parseProof(memo), signer: tx.transaction.message.accountKeys[0]?.pubkey?.toBase58(), slot: tx.slot };
}

$('#verify-form').addEventListener('submit', async (event) => {
  event.preventDefault(); clearMessages();
  const button = event.submitter; setBusy(button, true, 'Verify receipt ↗');
  try {
    const signature = $('#signature').value.trim();
    if (!/^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(signature)) throw new Error('Enter a valid Solana transaction signature.');
    const { proof, signer, slot } = await readMemo(signature);
    const reference = $('#reference').value.trim();
    const match = reference ? await matchesShipment(proof, reference) : null;
    $('#result').innerHTML = `<p class="overline">VERIFIED ON SOLANA DEVNET</p><h3>${escapeHtml(proof.milestone)}</h3><div class="detail-grid"><div><small>Timestamp declared by sender</small><b>${escapeHtml(new Date(proof.at).toLocaleString())}</b></div><div><small>Confirmed in slot</small><b>${slot}</b></div><div><small>Signer</small><b class="wrap">${escapeHtml(signer || 'Unknown')}</b></div><div><small>Shipment reference</small><b>${match === null ? 'Enter a reference to compare' : match ? 'Hash matches ✓' : 'Hash does not match'}</b></div></div><p>${escapeHtml(proof.note || 'No public note supplied.')}</p><p class="fineprint">On-chain shipment hash: ${escapeHtml(proof.shipment)}${proof.evidence ? `<br>Evidence hash: ${escapeHtml(proof.evidence)}` : ''}</p><a class="secondary" href="https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet" target="_blank" rel="noopener noreferrer">Open in Solana Explorer ↗</a>`;
    $('#result').classList.remove('hidden');
  } catch (error) { showError(error.message || 'Could not verify the receipt.'); }
  finally { setBusy(button, false, 'Verify receipt ↗'); }
});

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
