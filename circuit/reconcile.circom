pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

// Demonstration circuit for one identified deposit/credit/ledger triple.
// It does not prove that a source contained every transaction.
template ReconcileTriple() {
    signal input ruleVersion;
    signal input windowId;
    signal input depositRef;
    signal input depositAsset;
    signal input depositAmount;
    signal input creditRef;
    signal input creditAsset;
    signal input creditAmount;
    signal input ledgerRef;
    signal input ledgerAsset;
    signal input ledgerAmount;

    signal output depositCommitment;
    signal output creditCommitment;
    signal output ledgerCommitment;
    signal output mismatch;

    component depositHash = Poseidon(5);
    component creditHash = Poseidon(5);
    component ledgerHash = Poseidon(5);
    depositHash.inputs[0] <== ruleVersion;
    depositHash.inputs[1] <== windowId;
    depositHash.inputs[2] <== depositRef;
    depositHash.inputs[3] <== depositAsset;
    depositHash.inputs[4] <== depositAmount;
    creditHash.inputs[0] <== ruleVersion;
    creditHash.inputs[1] <== windowId;
    creditHash.inputs[2] <== creditRef;
    creditHash.inputs[3] <== creditAsset;
    creditHash.inputs[4] <== creditAmount;
    ledgerHash.inputs[0] <== ruleVersion;
    ledgerHash.inputs[1] <== windowId;
    ledgerHash.inputs[2] <== ledgerRef;
    ledgerHash.inputs[3] <== ledgerAsset;
    ledgerHash.inputs[4] <== ledgerAmount;
    depositCommitment <== depositHash.out;
    creditCommitment <== creditHash.out;
    ledgerCommitment <== ledgerHash.out;

    component refCredit = IsEqual();
    component refLedger = IsEqual();
    component assetCredit = IsEqual();
    component assetLedger = IsEqual();
    component amountCredit = IsEqual();
    component amountLedger = IsEqual();
    signal matchA;
    signal matchB;
    signal matchC;
    signal matchD;
    refCredit.in[0] <== depositRef;
    refCredit.in[1] <== creditRef;
    refLedger.in[0] <== depositRef;
    refLedger.in[1] <== ledgerRef;
    assetCredit.in[0] <== depositAsset;
    assetCredit.in[1] <== creditAsset;
    assetLedger.in[0] <== depositAsset;
    assetLedger.in[1] <== ledgerAsset;
    amountCredit.in[0] <== depositAmount;
    amountCredit.in[1] <== creditAmount;
    amountLedger.in[0] <== depositAmount;
    amountLedger.in[1] <== ledgerAmount;
    matchA <== refCredit.out * refLedger.out;
    matchB <== assetCredit.out * assetLedger.out;
    matchC <== amountCredit.out * amountLedger.out;
    matchD <== matchA * matchB;
    mismatch <== 1 - matchD * matchC;
}

component main {public [ruleVersion, windowId]} = ReconcileTriple();
