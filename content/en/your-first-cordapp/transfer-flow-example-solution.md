---
title: Transfer flow example solution
description: An example transfer IOU flow
slug: transfer-flow-example-solution
aliases: [
  "/first-code/solution-flows-move/",
  "/first-code/solution-flows-redeem/"
]
menu:
  main:
    parent: your-first-cordapp
    weight: 60  
weight: 60
---

An example transfer IOU flow

You looked at the Issue flow solution example and then worked on your own Transfer flow.  

## TransferFlows

The transfer flow will allow the lender to transfer the IOU to a new lender. This flow could be developed on the same concepts mentioned in the previous chapter. So, here we won’t discuss what has already been covered but will see what is different. For quick reference find the code in [Java](https://github.com/r3developer/obligation-cordapp).

What the transfer **initiator** flow does in a nutshell is:
1. Collect the required information.
2. Generate the transaction.
3. Verify it.
4. Sign the transaction.
5. Collect signatures from other lender and borrower.
6. Request a signature from the notary.
7. Send it over to all holders.

And all the transfer responder flow does is:
1. Sign the transaction.
2. Accept the fully signed transaction.
      
As this is not an issuance transaction, the flow must take an input state. Thus, to collect the required information, this flow will query the vault. All it takes as an input in constructor is stateLinearId and the new lender.

```java      
public static class InitiatorFlow extends FlowLogic<SignedTransaction> {
   private final UniqueIdentifier stateLinearId;
   private final Party newLender;

   public InitiatorFlow(UniqueIdentifier stateLinearId, Party newLender) {
       this.stateLinearId = stateLinearId;
       this.newLender = newLender;
   }
```

The `stateLinearId` will then be used to query the vault. Notice the use of `StateAndRef`.

```java
@Suspendable
@Override
public SignedTransaction call() throws FlowException {

   // 1. Retrieve the IOU State from the vault using LinearStateQueryCriteria
   List<UUID> listOfLinearIds = new ArrayList<>();
   listOfLinearIds.add(stateLinearId.getId());
   QueryCriteria queryCriteria = new QueryCriteria.LinearStateQueryCriteria(null, listOfLinearIds);

   // 2. Get a reference to the inputState data that we are going to settle.
   Vault.Page results = getServiceHub().getVaultService().queryBy(IOUState.class, queryCriteria);
   StateAndRef inputStateAndRefToTransfer = (StateAndRef) results.getStates().get(0);
   IOUState inputStateToTransfer = (IOUState) inputStateAndRefToTransfer.getState().getData();
```

Once the `StateAndRef` has been fetched one could get the required and build the transaction.
The further steps will be similar to the issue flow.


### Tests

Once again, the tests are pretty run of the mill. They check that:
* The transaction created is as expected, which includes:
  * Signatures. 
  * Inputs.
  * Outputs.
* The transaction has been recorded in vaults.
* States have been recorded, or not, in vaults.

### [`Settle Flow`](https://github.com/corda/corda-training-code/blob/master/020-first-token/workflows/src/main/java/com/template/flows/MoveFlows.java)

Hope you were able to get your settle flow running. The settle flow will allow for the settling of the IOU. It won’t need any new concept that hasn’t been discussed. You could find the entire code in the repository. Use the steps in the README of the repository to test your CorDapp.
