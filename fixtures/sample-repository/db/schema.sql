-- Fictional project schema used only by the AuditMind guided demo.
CREATE TABLE coinDeposit (
  depositId TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  asset TEXT NOT NULL,
  amountCents INTEGER NOT NULL,
  status TEXT NOT NULL,
  recordedAt TIMESTAMP NOT NULL
);

CREATE TABLE transactions (
  transactionId TEXT PRIMARY KEY,
  depositId TEXT,
  accountId TEXT NOT NULL,
  direction TEXT NOT NULL,
  asset TEXT NOT NULL,
  amountCents INTEGER NOT NULL,
  recordedAt TIMESTAMP NOT NULL
);
