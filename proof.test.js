import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildProof, matchesShipment, parseProof, PREFIX } from './proof.js';

test('hashes the reference locally and matches the correct shipment', async () => {
  const { memo, payload } = await buildProof({ shipment: 'TP-001', milestone: 'Delivered', evidence: 'POD-7', note: 'Handed to recipient', timestamp: '2026-10-16T00:00:00.000Z' });
  assert.ok(memo.startsWith(PREFIX));
  assert.ok(!memo.includes('TP-001'));
  assert.ok(!memo.includes('POD-7'));
  assert.deepEqual(parseProof(memo), payload);
  assert.equal(await matchesShipment(payload, 'TP-001'), true);
  assert.equal(await matchesShipment(payload, 'TP-002'), false);
});

test('rejects malformed proof and missing reference', async () => {
  await assert.rejects(() => buildProof({ shipment: '', milestone: 'Delivered' }));
  assert.throws(() => parseProof('other:thing'));
});
