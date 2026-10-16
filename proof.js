export const MEMO_PROGRAM = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
export const PREFIX = 'SHIPPROOF_V1:';
export const MAX_MEMO_BYTES = 480;

export function cleanInput(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

export async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function buildProof({ shipment, milestone, note, evidence, timestamp }) {
  const shipmentId = cleanInput(shipment, 80);
  const milestoneName = cleanInput(milestone, 48);
  const milestoneNote = cleanInput(note, 160);
  const evidenceText = cleanInput(evidence, 500);
  if (!shipmentId || !milestoneName) throw new Error('Add a shipment reference and milestone.');
  const payload = {
    v: 1,
    shipment: await sha256Hex(shipmentId),
    milestone: milestoneName,
    note: milestoneNote,
    evidence: evidenceText ? await sha256Hex(evidenceText) : null,
    at: timestamp || new Date().toISOString()
  };
  const memo = PREFIX + JSON.stringify(payload);
  if (new TextEncoder().encode(memo).length > MAX_MEMO_BYTES) throw new Error('Proof is too large for this demo. Shorten the note.');
  return { payload, memo };
}

export function parseProof(data) {
  if (!data.startsWith(PREFIX)) throw new Error('This transaction does not contain a ShipProof memo.');
  const value = JSON.parse(data.slice(PREFIX.length));
  if (value.v !== 1 || !/^[a-f0-9]{64}$/.test(value.shipment) || !value.milestone || !value.at) {
    throw new Error('The ShipProof memo is malformed.');
  }
  return value;
}

export async function matchesShipment(payload, reference) {
  return payload.shipment === await sha256Hex(cleanInput(reference, 80));
}
