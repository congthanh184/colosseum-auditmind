import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const artifacts = join(root, 'artifacts');
mkdirSync(artifacts, { recursive: true });
const snarkjs = join(root, 'node_modules', '.bin', 'snarkjs');

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}

run('circom', ['circuit/reconcile.circom', '--r1cs', '--wasm', '--sym', '-l', 'node_modules', '-o', 'artifacts']);
if (!existsSync(join(artifacts, 'pot12_final.ptau'))) {
  run(snarkjs, ['powersoftau', 'new', 'bn128', '12', 'artifacts/pot12_0000.ptau']);
  run(snarkjs, ['powersoftau', 'contribute', 'artifacts/pot12_0000.ptau', 'artifacts/pot12_0001.ptau', '--name=AuditMind demo phase 1', `-e=${randomBytes(32).toString('hex')}`]);
  run(snarkjs, ['powersoftau', 'prepare', 'phase2', 'artifacts/pot12_0001.ptau', 'artifacts/pot12_final.ptau']);
}
run(snarkjs, ['groth16', 'setup', 'artifacts/reconcile.r1cs', 'artifacts/pot12_final.ptau', 'artifacts/reconcile_0000.zkey']);
run(snarkjs, ['zkey', 'contribute', 'artifacts/reconcile_0000.zkey', 'artifacts/reconcile_final.zkey', '--name=AuditMind demo phase 2', `-e=${randomBytes(32).toString('hex')}`]);
run(snarkjs, ['zkey', 'export', 'verificationkey', 'artifacts/reconcile_final.zkey', 'artifacts/verification_key.json']);
console.log('Demo proving artifacts are ready. This local ceremony is for a prototype, not production.');
