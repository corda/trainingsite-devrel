---
title: Move flow example solution
description: An example move Tokens flow
slug: solution-flows-move
menu:
  main:
    parent: first-code
    weight: 70
weight: 70
---


You looked at the Issue flow solution example and then worked on your own Move flow. You can find the code in [Java](https://github.com/corda/corda-training-code/blob/master/020-first-token/workflows/src/main/java/com/template/flows/MoveFlows.java) and [Kotlin](https://github.com/corda/corda-training-code/blob/master/020-first-token/workflows/src/main/kotlin/com/template/flows/MoveFlowsK.kt).

## [`MoveFlows`](https://github.com/corda/corda-training-code/blob/master/020-first-token/workflows/src/main/java/com/template/flows/MoveFlows.java)

First, let's have a diagram that sums up this flow:

![MoveFlows CDL](/first-code/cdl_move_tokens.png)

This chapter is not going to do a repeat discussion of the concepts that were already covered with the `IssueFlows`, and instead discuss about what is different.

What the move **initiator** flow does in a nutshell is:

1. Collect the required information.
2. Generate the transaction.
3. Verify it.
4. Sign the transaction.
5. Collect signatures from other holders.
6. Request a signature from the notary.
7. Send it over to all holders.

The only difference with `IssueFlows` are points 5 and 6. And all the move **responder** flow does is:

1. Sign the transaction.
2. Accept the fully signed transaction.

Wait, **no, not exactly**. There are some parties that need to sign and some parties that don't need to sign. You see, only the input holders need to sign, not the output holders. So since eventually the transaction is sent to all parties, the flow needs to tell each responder whether it expects a signature from them or not.

The following design decisions were taken:

* The flow does not use the preferred notary, instead, it uses the notary of the input states. After all, a transaction must use a single notary so it might as well take it from the inputs. It does not enforce that the inputs notary is the preferred one as it is entirely possible that the holders decided to change the notary, which is an advanced operation you shall see at a later stage.
* The `Initiator` constructor takes a very prescriptive list of inputs, whose rationale will be explained shortly.
* In the same vein as for the `IssueFlows`, the flow can issue as many `TokenState` instances, with whichever `holder` and `quantity` desired. As long as the invariants enforced by the contract are respected.
* Any input holder can initiate the flow.
* Unlike the `IssueFlows`, the `Responder` is unsafe, in order to demonstrate an example of action that can be taken at the node level to fit a workflow.
* On the other hand, this `Responder` flow is not annotated with `@InitiatedBy`, this ensures that only a decisive action can enable the link. This does not prevent a safer child class of `Responder`, or another implementation entirely, to be later annoted with `@InitiatedBy` if so required.
* The issuers are not informed of any `Move` transaction as the whole project assumes they are only interested in the changes of total supply.

### [`TransactionRole`](https://github.com/corda/corda-training-code/blob/master/020-first-token/workflows/src/main/java/com/template/flows/MoveFlows.java#L33-L34)

As its name suggests, it describes what role is expected of a responding party:

```java
@CordaSerializable
enum TransactionRole {SIGNER, PARTICIPANT}
```
Self-explanatory:

* Any input holder will be considered as `SIGNER`.
* While the remaining holders, in effect those found only in outputs, will be considered as `PARTICIPANT`.

Because this is a flag that will be sent over the wire to each responder node, it had to be annotated with `@CordaSerializable`. If necessary it will also make it serialisable at checkpoints.

## [`Initiator`](https://github.com/corda/corda-training-code/blob/master/020-first-token/workflows/src/main/java/com/template/flows/MoveFlows.java#L42-L44)

The class declaration is unremarkable by now.

### The fields

Mentioned earlier is that this flow takes a very prescriptive list of inputs. That is the list:

```java
@NotNull
private final List<StateAndRef<TokenState>> inputTokens;
```
The information contained here is:

* The order of the inputs will be respected. I.e. `inputTokens[x]` will be at the `x`th position in the transaction inputs.
* Since a `StateRef` (notice: this is not `StateAndRef`) is the type added to the inputs of a transaction, there is no equivocation here.
* The notary information is also available in each `StateAndRef`.
* All `holder` information for all states, which will inform the flow on from which peers it needs to ask a signature.

Of course, the `List<StateAndRef<TokenState>>` type is not exactly the user-friendly type that you can easily slap together on the node shell. That was not the point here. Consider this flow as the base one, which can be called by other friendlier ones.

{{<HighlightBox type="info">}}

> Why not add another constructor that takes an amount of tokens to send to another party, and do the `StateAndRef` transformation in the constructor itself?

It is not possible because [`.toStateAndRef`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/node/ServiceHub.kt#L241) requires access to the vault, and, as you recall, a flow has access to the service hub only when `call`ed. At instantiation, a flow is a simple Java object that does not know on which node it will run.

If you need a more friendly flow that, for instance, takes an amount of your tokens to send to another party, then:

* You would create another flow.
* Which, in `call`, converts the friendly information into `StateAndRef`.
* Then instantiates `Initiator` with these precise `StateAndRef`.
* Then calls `subFlow` with this `Initiator` instance.

In effect, you would create an _upstream_ flow, which is perfectly fine. And this is exactly what you will see in the redeem flow chapter.

{{</HighlightBox>}}

As for the output tokens, this should make sense:

```java
@NotNull
private final List<TokenState> outputTokens;
```
Why not a `List<Pair<Party, Long>>`? Because, here it is started by a holder and so the issuer is not available; not to mention that there would likely be more than 1 issuer. Of course, if there are inconsistencies between the inputs and outputs, the contract will catch that.

The other field is the `progressTracker`. As opposed to the `IssueFlows` case, here, it is assumed that another flow would care to pass in a different tracker at instantiation, because it takes unfriendly parameters and would be launched from another flow. Plus, since this is the second example flow, it is time to amp the difficulty up a notch.

### The constructors

The previous comments explain the main constructor:

```java
public Initiator(
        @NotNull final List<StateAndRef<TokenState>> inputTokens,
        @NotNull final List<TokenState> outputTokens,
        @NotNull final ProgressTracker progressTracker) {
    //noinspection ConstantConditions
    if (inputTokens == null) throw new NullPointerException("inputTokens cannot be null");
    if (inputTokens.isEmpty()) throw new IllegalArgumentException("inputTokens cannot be empty");
    //noinspection ConstantConditions
    if (outputTokens == null) throw new NullPointerException("outputTokens cannot be null");
    if (outputTokens.isEmpty()) throw new IllegalArgumentException("outputTokens cannot be empty");
    final boolean noneZero = outputTokens.stream().noneMatch(outputToken -> outputToken.getQuantity() <= 0);
    if (!noneZero) throw new IllegalArgumentException("outputTokens quantities must all be above 0");
    //noinspection ConstantConditions
    if (progressTracker == null) throw new NullPointerException("progressTracker cannot be null");
    this.inputTokens = inputTokens;
    this.outputTokens = outputTokens;
    this.progressTracker = progressTracker;
}
```
It does some early checks to catch potential errors that might be caught in `call` only. It does not perform all state checks done by the contract, but it could if you wanted it to be exhaustive. Notice how the `progressTracker` is a constructor parameter too so as to let others pass their own, a la `CollectSignaturesFlow`. As is often the case, there is an extra constructor that takes the default `progressTracker`, `tracker()`:

```java
public Initiator(@NotNull final List<StateAndRef<TokenState>> inputTokens,
                 @NotNull final List<TokenState> outputTokens) {
    this(inputTokens, outputTokens, tracker());
}
```
With this preparation done, let's move to the `call` function.

### Generating the transaction

Do you need an introduction to `.stream()`? Naah. You can see that the flow collects the distinct notaries:

```java
final Set<Party> notaries = inputTokens.stream()
        .map(it -> it.getState().getNotary())
        .collect(Collectors.toSet());
```
And hope that there is a single one.

```java
if (notaries.size() != 1) {
    throw new FlowException("There must be only 1 notary, not " + notaries.size());
}
final Party notary = notaries.iterator().next();
```
As part of the preparation, it needs to gather the distinct signers:

```java
final Set<Party> allSigners = inputTokens.stream()
        .map(it -> it.getState().getData().getHolder())
        .collect(Collectors.toSet());
```
And as said earlier, it checks whether whether it is a holder too:

```java
if (!allSigners.contains(getOurIdentity())) throw new FlowException("I must be a holder.");
```
Why bother?

* When you call `CollectSignaturesFlow`, the other peers will refuse to sign if you did not sign it yourself,
* So the flow needs to sign too,
* But you don't like signing a transaction for which your signature is not absolutely required. Don't you?

So the developer of this flow decided to make it easier for the node operator to have mistakes flagged.

Creating the command should start to look familiar now, with the required signers affixed to it:

```java
final Command<Move> txCommand = new Command<>(
        new Move(),
        allSigners.stream().map(Party::getOwningKey).collect(Collectors.toList()));
```
Likewise for the transaction builder:

```java
final TransactionBuilder txBuilder = new TransactionBuilder(notary)
        .addCommand(txCommand);
```
Now, for the inputs, you have to admit that the type of the field is adequate:

```java
inputTokens.forEach(txBuilder::addInputState);
```
And for the outputs, you should recognize it from the `IssueFlows`:

```java
outputTokens.forEach(it -> txBuilder.addOutputState(it, TokenContract.TOKEN_CONTRACT_ID));
```

### Gathering the signatures

Let's skip over what you have seen enough times by now:

```java
txBuilder.verify(getServiceHub());
final SignedTransaction partlySignedTx = getServiceHub().signInitialTransaction(txBuilder);
```
And see that it creates flow sessions for all required signers other than itself, since it already signed the transaction:

```java
final List<FlowSession> signerFlows = allSigners.stream()
        .filter(it -> !it.equals(getOurIdentity()))
        .map(this::initiateFlow)
        .collect(Collectors.toList());
```
You will recall that `allSigners` is a `Set`, and so has no duplicate. That is an important consideration when  contacting peers. Don't waste CPU cycles, and risk rejection from peers that see you ask them to sign the same thing twice.

At this point, `initiateFlow` has only created `FlowSession` instances, a.k.a. "session ids", no communication has been initated yet.

{{<HighlightBox type="info">}}

It is not the first time you see a `SessionFlow`. However, so far in all the flows you have seen, when a `FlowSession` was created, it was simply passed as an argument to other inlined flows, like `FinalityFlow`. In fact, this `FlowSession` is a complex object that abstracts a lot of complexity, and allows you to communicate directly with the responder flow at the other end. In particular, you can `.send` serialisable objects, or receive them. Let's do that now.

{{</HighlightBox>}}

Remember `TransactionRole`? Let's inform the signers of their role in this choreography with a simple `.send`, which _fires-and-forgets_. Notice how unceremonious this `.send` is, it just takes [any payload type](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/flows/FlowSession.kt#L193) and sends it over the wire, as long as it is `@CordaSerializable`. However this is no issue as our flow pairs are choreographed together so our `Responder` will know what to expect when `.receive`ing:

```java
for (final FlowSession it : signerFlows) {
    it.send(TransactionRole.SIGNER);
}
```
Ha! No `signerFlows.stream().map(someLambda)` now? Alas no, since `.send()`, although involving no checkpoint, is still annotated with `@Suspendable`, you would have to annotate the `someLambda` function as `@Suspendable` too, so instead it uses the good ol' `for` loop. In Kotlin, it is more permissive because [`onEach`](https://github.com/JetBrains/kotlin/blob/4d7597fa5aadb0093b7b90fa76823271a9336cdc/libraries/stdlib/common/src/generated/_Collections.kt#L1678-L1680) as a `for` loop too:

```kotlin
val signerFlows = signers
        .minus(ourIdentity)
        .map { initiateFlow(it) }
        .onEach { it.send(TransactionRole.SIGNER) }
```
With this expected-role-priming done, it asks for signatures:

```java
final SignedTransaction fullySignedTx = signerFlows.isEmpty() ? partlySignedTx :
        subFlow(new CollectSignaturesFlow(
                partlySignedTx,
                signerFlows,
                GATHERING_SIGS.childProgressTracker()));
```
Notice that:

* There may be no extra signers, hence the `signerFlows.isEmpty() ? partlySignedTx` part.
* It passes a `childProgressTracker` so that it can sub-track the state. This `MoveFlows.Initiator` allows similar parameter passing.

### Finalisation

Before moving to the finalisation proper, it needs to inform the other peers, those that are mere `PARTICIPANT`s. Who are they:

```java
final List<FlowSession> newHolderFlows = outputTokens.stream()
        .map(TokenState::getHolder)
        .distinct()
        .filter(it -> !allSigners.contains(it))
        .map(this::initiateFlow)
        .collect(Collectors.toList());
```
Of course:

* They can only be found in the `outputTokens.stream()`,
* They cannot be found in the signers: `.filter(it -> !allSigners.contains(it))`

In the same way it primed the signers, it primes these participants:

```java
for (final FlowSession it : newHolderFlows) {
    it.send(TransactionRole.PARTICIPANT);
}
```
Then, for all of them:

```java
final List<FlowSession> allFlows = new ArrayList<>(signerFlows);
allFlows.addAll(newHolderFlows);
```
It lets `FinalityFlow` take care of contacting the notary and sending the result to all the peers:

```java
return subFlow(new FinalityFlow(
        fullySignedTx,
        allFlows,
        FINALISING_TRANSACTION.childProgressTracker()));
```
With this, let's move to the `Responder` and confirm that it follows this choreography.

## `Responder`

You will recall that the `Initiator` did 3 actions that require responding to:

1. Sent the role.
2. Asked for signature, optionally.
3. Finalized.

Because of this _optionally_, the responder needs to branch depending on its role.

### Receiving role

This is straightforward:

```java
final TransactionRole myRole = counterpartySession.receive(TransactionRole.class).unwrap(it -> it);
```
and exhibits `.receive` as the action expected of the responder, when an unceremonious `.send` is performed. It does not perform checks when unwrapping it, as nothing [really bad](https://api.corda.net/api/corda-os/4.3/html/api/javadoc/net/corda/core/utilities/UntrustworthyData.html) can happen on an `enum`.

It is worth nothing that unlike a `.send`, a `.receive` is blocking. In effect, at this point the flow is suspended, and only revived when there is something to receive.

### Branching

With its role known, the `Responder` can branch, only `SIGNER`s do the extra step:

```java
final SecureHash txId;
switch (myRole) {
    case PARTICIPANT:
        txId = null;
        break;
    case SIGNER: {
        [...]
        break;
    default:
        throw new FlowException("Unexpected value: " + myRole);
```
The extra step is to sign the transaction, and as mentioned earlier, as it is, the flow is dangerous because it automatically signs off your tokens away. Checking that you are relevant is cold comfort, while showing off the use of the `ServiceHub` to inflate the input states from only their `StateRef`:

```java
relevant = stx.toLedgerTransaction(getServiceHub(), false)
        .inputsOfType(TokenState.class)
        .stream()
        .anyMatch(it -> it.getHolder().equals(getOurIdentity()));
```

### Finalising

Now that it is back into the main branch, the responder can finalize as per usual, using the expected transaction id that it, perhaps, just signed:

```java
return subFlow(new ReceiveFinalityFlow(counterpartySession, txId));
```

### Tests

Once again, the tests are pretty run of the mill. They check that:

* The transaction created is as expected, which includes:
    * Signatures.
    * Inputs.
    * Outputs.
* The transaction has been recorded in vaults.
* States have been recorded, or not, in vaults.

One special mention has to be made here. As part of the setup, the `MoveFlows.Responder` flow is explicitly linked to the `MoveFlows.Initiator`:

```java
it.registerInitiatedFlow(IssueFlows.Responder.class);
it.registerInitiatedFlow(MoveFlows.Initiator.class, MoveFlows.Responder.class);
```

1. The `IssueFlows.Responder` class is already annotated with `@InitiatedBy` to point to `IssueFlows.Initiator`, so `registerInitiatedFlow` can collect this information on its own.
2. However, `MoveFlows.Responder` is not annotated and so has to be explicitly associated with `MoveFlows.Initiator` for the duration of the tests. You will recall the comment that this was a decision to prevent unwittingly setting up a dangerous auto-responder.

Have a look too at the `FlowHelpers` class which parks some boilerplate to instantiate and issue tokens.

## Conclusion

If you look carefully, you will notice that although the `Initiator` is prescriptive, it nonetheless enables all transactions allowed by the contract, at the expense of the `Responder`, which would have to be modified or child-classed to protect peers. You will also notice that if all `Initiator` inputs are held by only the initiating node, no call to the `Responder` will ask for a signature. Keep this in mind when you see the `RedeemFlows`.

Why bother with writing an unsafe `Responder`?

1. It allows testing the `Initiator`.
2. It exhibits the minimum choreography expected of a different `Responder`.
