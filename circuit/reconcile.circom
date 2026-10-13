pragma circom 2.0.0;
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

// Proves the comparison for one identified deposit and credit transaction.
// It does not prove all rows were supplied or checked.
template ReconcilePair() {
    signal input ruleVersion;
    signal input windowId;
    signal input depositRef;
    signal input depositAccount;
    signal input depositAsset;
    signal input depositAmount;
    signal input transactionRef;
    signal input transactionAccount;
    signal input transactionAsset;
    signal input transactionAmount;

    signal output depositCommitment;
    signal output transactionCommitment;
    signal output mismatch;

    component depositHash = Poseidon(6);
    component transactionHash = Poseidon(6);
    depositHash.inputs[0] <== ruleVersion;
    depositHash.inputs[1] <== windowId;
    depositHash.inputs[2] <== depositRef;
    depositHash.inputs[3] <== depositAccount;
    depositHash.inputs[4] <== depositAsset;
    depositHash.inputs[5] <== depositAmount;
    transactionHash.inputs[0] <== ruleVersion;
    transactionHash.inputs[1] <== windowId;
    transactionHash.inputs[2] <== transactionRef;
    transactionHash.inputs[3] <== transactionAccount;
    transactionHash.inputs[4] <== transactionAsset;
    transactionHash.inputs[5] <== transactionAmount;
    depositCommitment <== depositHash.out;
    transactionCommitment <== transactionHash.out;

    component refEqual = IsEqual();
    component accountEqual = IsEqual();
    component assetEqual = IsEqual();
    component amountEqual = IsEqual();
    signal matchA;
    signal matchB;
    refEqual.in[0] <== depositRef;
    refEqual.in[1] <== transactionRef;
    accountEqual.in[0] <== depositAccount;
    accountEqual.in[1] <== transactionAccount;
    assetEqual.in[0] <== depositAsset;
    assetEqual.in[1] <== transactionAsset;
    amountEqual.in[0] <== depositAmount;
    amountEqual.in[1] <== transactionAmount;
    matchA <== refEqual.out * accountEqual.out;
    matchB <== assetEqual.out * amountEqual.out;
    mismatch <== 1 - matchA * matchB;
}
component main {public [ruleVersion, windowId]} = ReconcilePair();
