import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import * as snarkjs from 'snarkjs';
import { buildPoseidon } from 'circomlibjs';
import { sources, windowId } from './data.mjs';

const root = resolve(import.meta.dirname, '..');
const wasm = join(root, 'artifacts/reconcile_js/reconcile.wasm');
const zkey = join(root, 'artifacts/reconcile_final.zkey');
const vkey = join(root, 'artifacts/verification_key.json');
const field = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;

function fieldRuleVersion(hex) { return (BigInt(`0x${hex}`) % field).toString(); }

export async function proveTriple(version) {
  const d = sources.deposits[0];
  const c = sources.credits[0];
  const l = sources.ledger[0];
  const versionField = fieldRuleVersion(version);
  const input = {
    ruleVersion: versionField, windowId,
    depositRef: d.referenceCode, depositAsset: d.assetCode, depositAmount: d.amountCents,
    creditRef: c.referenceCode, creditAsset: c.assetCode, creditAmount: c.amountCents,
    ledgerRef: l.referenceCode, ledgerAsset: l.assetCode, ledgerAmount: l.amountCents
  };
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, wasm, zkey);
  const verificationKey = JSON.parse(await readFile(vkey, 'utf8'));
  const verified = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
  if (!verified) throw new Error('Proof verification failed');
  const poseidon = await buildPoseidon();
  const hashRow = row => poseidon.F.toString(poseidon([BigInt(versionField), BigInt(windowId), BigInt(row.referenceCode), BigInt(row.assetCode), BigInt(row.amountCents)]));
  const expected = [hashRow(d), hashRow(c), hashRow(l), '1', versionField, String(windowId)];
  if (JSON.stringify(publicSignals) !== JSON.stringify(expected)) throw new Error('Proof public signals do not match the source snapshot');
  return {
    system: 'Groth16 / BN254', verified, proof, publicSignals,
    commitments: { deposit: publicSignals[0], credit: publicSignals[1], ledger: publicSignals[2] },
    mismatch: Number(publicSignals[3]),
    ruleVersionField: versionField,
    windowId
  };
}
