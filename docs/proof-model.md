# AuditMind proof model

The Colosseum pitch's slides 6–7 describe a **proposed batch circuit**. The running MVP has a narrower, real **one-pair circuit**. Run Review must keep those scopes separate.

## What runs today

1. An approved business question becomes generated JavaScript check code. The worker executes that exact proposal against 20 synthetic deposits and 20 synthetic credits. It checks credit cardinality, account, asset, and numeric amount. The specific `50 USDT → 50 ETH` error comes from this check.
2. The Circom circuit receives one identified deposit and credit pair as private witness values. Its equality constraints compute one public `mismatch` bit. `mismatch = 1` is a valid **failure result**, not a failed proof.
3. The same circuit computes two Poseidon row commitments from the rule version, run date, and encoded row fields. Its public signals are `[depositCommitment, transactionCommitment, mismatch, ruleVersion, windowId]`.
4. Groth16 verification confirms that these public outputs satisfy this circuit for some witness. The server also compares the public signals with its synthetic source snapshot. The proof does not expose which field differs; the JavaScript result identifies the asset.

The difference between the two row hashes is **not** the reconciliation test. They bind the pair's values to the proof. They are neither full-table Merkle roots nor evidence that every database row was included.

In Circom, `<==` assigns a signal **and** adds a constraint; `===` adds a constraint. A plain `assert(...)` is a compiler or witness-time check and should not be substituted for an R1CS constraint.

## What the pitch's batch example would require

- Define canonical row encoding, ordering, snapshot boundaries, and duplicate handling. Independently authenticate the complete deposit, credit, and reserve snapshots before treating their Merkle roots as facts about a real database.
- Constrain the batch join and report **unmatched deposits, unmatched credits, and duplicate matches**. `count(credits) - count(linked)` alone does not detect a deposit without a credit.
- Count amount and asset failures on uniquely linked pairs. Equal numeric values do not imply equal assets.
- Version the price policy and asset decimals. To prove `reserve − liabilities >= 0`, use bounded integer arithmetic and a constrained nonnegative/range check; ordinary finite-field subtraction has no signed ordering.
- Bind the public roots, rule version, exception counts, and pass flags in one circuit. A verifier may accept a proof whose business pass flag is false: verification means the reported computation is valid, not that the business is healthy.

The pitch's `linked = 8`, `orphan = 1`, and reserve figures are illustrative. The MVP does not compute or prove those batch outputs.

## Primary references

- [Circom constraint generation](https://docs.circom.io/circom-language/constraint-generation/)
- [Circom code assertions](https://docs.circom.io/circom-language/code-quality/code-assertion/)
- [Circom public and private signals](https://docs.circom.io/circom-language/signals/)
- [circomlib Poseidon circuit](https://github.com/iden3/circomlib/blob/master/circuits/poseidon.circom)
- [snarkjs proof and public-signal verification](https://github.com/iden3/snarkjs)
