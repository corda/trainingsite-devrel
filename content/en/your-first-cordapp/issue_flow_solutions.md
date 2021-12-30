---
title: Issue flow solution
description: An example issue Tokens flow
slug: solution-flows-issue
menu:
  main:
    parent: your-first-cordapp
    weight: 50
weight: 50
---

In the same way, you proceeded with state and contract, you have done your exercise, you have at least your own `IssueFlow`. Perhaps also `TransferFlow` and `SettleFlow`, or more than that. Now, compare what you did to this example observing some best practices. As always, there is no single truth as to implementation but the hope is that you will reflect on your first attempt given the remarks here.  Let's go. For quick reference find the code in [Java](https://github.com/r3developer/obligation-cordapp).

What the issue **initiator** flow does in a nutshell is:

1. Collect the required information.
2. Generate the transaction.
3. Verify it.
4. Sign the transaction.
5. Get the transaction signed by counter-parties and finalize.
      
And all the issue responder flow does is:

2. Accept the transaction if it’s an IOU issuance transaction.
      
The following design decisions were taken:
* Initiator and responder flows are encapsulated inside an `interface`. This provides a way to clearly identify them, by `new IOUIssueFlow.InitiatorFlow()`, considering that we do not need to instantiate the encapsulating `IssueFlow`.
* It can issue an `IOUState` instance, with whichever `lender` and `quantity` as wanted.
* It is the borrower that initiates the flow.

A flow is implemented as one or more communicating FlowLogic subclasses. You then define the actions taken by the flow by overriding FlowLogic.call.

First, a flow will need a Notary to proceed.

```java
final Party notary = getServiceHub().getNetworkMapCache().getNotaryIdentities().get(0);
```

Choosing a notary is a decision in itself, so declaring a preference is R3's recommended practice. Consider:

* What performance, availability, or even discretion do you expect from it?
* Do you want a validating notary?
* The notary you picked randomly, is it a for-profit notary that wants to be paid per transaction batch or with a subscription?
* Why would your consortium app use the notary of another consortium?

The downside of having it hard-coded like this is that, should it change, you would have to redeploy your Jars. So, as part of a proper deployment, you could put this information into a configuration file. Here and now, for simplicity's sake, it is declared as a final object inside the class.

### `Initiator`

#### The class declaration

```java
@InitiatingFlow
@StartableByRPC
public static class InitiatorFlow extends FlowLogic<SignedTransaction> {
```
* It has to extend `FlowLogic` to be considered as a flow.
* It makes sense to call it `InitiatorFlow` as it is indeed an `@InitiatingFlow` one.
* It can be reasonably expected to be started from another part of the system, like the node shell, so it is annotated with `@StartableByRPC`.
* The primary purpose of this flow is to create an `Issue` transaction, so it is natural to expect it to return a `SignedTransaction`.

{{<HighlightBox type="info">}}

> Does a flow always return a `SignedTransaction`?

No, a flow can return any type of data, [including `Void`](https://github.com/corda/samples-java/blob/a61e2cc9910d7d5de83122bf7d36fd071796a7c3/Basic/flow-database-access/workflows-java/src/main/java/net/corda/samples/flowdb/AddTokenValueFlow.java#L17). Your flow could also encapsulate a complex [vault query](https://github.com/corda/samples/blob/e0052bfc491b9133110618a3f6046498a6f25cbb/flow-db/src/main/kotlin/com/flowdb/Flows.kt#L52-L60) or calls to [third-party APIs](https://github.com/corda/samples/blob/f6d9e6a5e8f9d38e597be9f661725610020dd666/flow-http/workflows-java/src/main/java/com/flowhttp/HttpCallFlow.java#L27-L28), and return the data type fetched.


> Will my transaction be finalized if the flow does not return it?

If you called `FinalityFlow` in your flow, then your transaction is finalized. The return type of your flow has no relevance to finality.

{{</HighlightBox>}}

#### The fields

To be able to run its operations, the flow needs some parameters as mentioned earlier. These are passed in the constructor. Here, we pass the `Party lender` and `int amount`. Both implementations are equally fine.

```java
private final int amount;
private final Party lender;
```

#### The constructors

This explains the main constructor:

```java
@InitiatingFlow
@StartableByRPC
public static class InitiatorFlow extends FlowLogic<SignedTransaction> {

    private final int amount;
    private final Party lender;

    public InitiatorFlow(int amount, Party lender) {

        this.amount = amount;
        this.lender = lender;

    }
}
```
With this preparation done, it is time to move on to the `call` function that starts the flow.

#### `call`

```java
@Suspendable
@Override
public SignedTransaction call() throws FlowException {
```
Not much to say about it, other than to draw your attention once more to the `@Suspendable` annotation picked up by Quasar's agent.

From there, the flow fetches the identity of the notary and the node running the flow.

```java
final Party notary = getServiceHub().getNetworkMapCache().getNotary(CordaX500Name.parse("O=Notary,L=London,C=GB"));

Party me = getOurIdentity();
```

And with this, it is time to generate the transaction. For this, we need to create a new Issue Command object. Remember, that our Contract expects a Command.

```java
// Generate an unsigned transaction
Party me = getOurIdentity();
IOUState state = new IOUState(amount, lender, me);
// Step 2. Create a new issue command.
// Remember that a command is a CommandData object and a list of CompositeKeys
List<PublicKey> listOfKeys = new ArrayList<>();
listOfKeys.add(state.getLender().getOwningKey());
listOfKeys.add(state.getBorrower().getOwningKey());
final Command<Issue> issueCommand = new Command<>(new Issue(), listOfKeys);
```

After this, you create a transaction builder and specify the notary that you fetched before.

```java
// Step 3. Create a new TransactionBuilder object.
final TransactionBuilder builder = new TransactionBuilder(notary);

// Step 4. Add the iou as an output states, as well as a command to the transaction builder.
builder.addOutputState(state, IOUContract.IOU_CONTRACT_ID);
builder.addCommand(issueCommand);
```

With the transaction ready, the flow checks whether it is valid:

```java
builder.verify(getServiceHub());
```

You will notice that the verification is done on the transaction builder. This builder does not store any signature, by design. A signature signs a finished transaction, so you would need the builder to first create the transaction before being able to sign it. You will recall that the contract verifies the presence of required signers, not the presence of signatures. That's why the verification passes even before the transaction was signed. Now, it signs the transaction. (The node running the Flow is signing the transaction here)

```java
final SignedTransaction ptx = getServiceHub().signInitialTransaction(builder);
```

Now, the flow requires the signature of the other parties.

```java
// Step 6. Collect the other party's signature using the CollectSignaturesFlow.Each required signer will need to
// respond by invoking its own SignTransactionFlow subclass to check the transaction (by implementing the checkTransaction method)
// and provide their signature if they are satisfied.
List<Party> otherParties = new ArrayList<Party>();
otherParties.add(state.getLender());
otherParties.add(state.getBorrower());
otherParties.remove(getOurIdentity());

// Collect all of the required signatures from other Corda nodes using the CollectSignaturesFlow
List<FlowSession> sessions = new ArrayList<>();
for (Party otherParty: otherParties) {
    sessions.add(initiateFlow(otherParty));
    }
SignedTransaction stx = subFlow(new CollectSignaturesFlow(ptx, sessions));
```

#### Finalisation

With this, you could now finalize the transaction.

```java
// Step 7. Assuming no exceptions, we can now finalise the transaction
return subFlow(new FinalityFlow(stx, sessions));
```

This is the end of the initiating flow, it is time to move to the responder flow, which needs to dance to the initiator's tune. Notice how here too it instantiated `FinalityFlow`, and then asked it to run on the node with `subFlow`. Two steps again.

### `Responder`

This will thankfully be short as it does not do much.

#### The class declaration

```java
@InitiatedBy(IOUIssueFlow.InitiatorFlow.class)
public static class ResponderFlow extends FlowLogic<SignedTransaction> {
```

Nothing that should surprise you at this stage.

#### The field

```java
private final FlowSession flowSession;
private SecureHash txWeJustSigned;
```

It only needs to know who has initiated the flow.

#### The constructor

```java
public ResponderFlow(FlowSession flowSession){
    this.flowSession = flowSession;
}
```

Now, we define the checkTransaction method

```java
@Override
    protected void checkTransaction(SignedTransaction stx) {
        requireThat(req -> {
            ContractState output = stx.getTx().getOutputs().get(0).getData();
            req.using("This must be an IOU transaction", output instanceof IOUState);
            return null;
        });
        // Once the transaction has verified, initialize txWeJustSignedID variable.
        txWeJustSigned = stx.getId();
    }
}
```

Now, to respond to the CollectSignatureFlow, we must sign the transaction if we are satisfied with it.

```java
// Create a sign transaction flows
SignTxFlow signTxFlow = new SignTxFlow(flowSession);

// Run the sign transaction flows to sign the transaction
subFlow(signTxFlow);
```

As the initiator flow had called the Finality Flow, we now call the ReceiveFinalityFlow.

```java
return subFlow(new ReceiveFinalityFlow(flowSession, txWeJustSigned));
```

### Tests

You will see that the tests are pretty run-of-the-mill. They check that:

* The transaction created is as expected, which includes:
    * Signatures.
    * Outputs.
* The transaction has been recorded in vaults.
* States have been recorded, or not, in vaults.

### `Progress Tracker`:

One may track the flow using a Progress Tracker. [Progress tracking](https://docs.r3.com/en/platform/corda/4.8/open-source/api-flows.html#progresstracker) exports information about the flows current status in such a way that observers can render it in a useful manner to humans who may need to be informed. 