---
title: Redeem flow example solution
description: An example Token redemption flow
slug: solution-flows-redeem
menu:
  main:
    parent: first-code
    weight: 80
weight: 80
---


You looked at both solution examples for Issue and Move flows, and have worked on your own Redeem flow. Find the code in [Java](https://github.com/corda/corda-training-code/blob/master/020-first-token/workflows/src/main/java/com/template/flows/RedeemFlows.java) and [Kotlin](https://github.com/corda/corda-training-code/blob/master/020-first-token/workflows/src/main/kotlin/com/template/flows/RedeemFlowsK.kt).

## [`RedeemFlows`](https://github.com/corda/corda-training-code/blob/master/020-first-token/workflows/src/main/java/com/template/flows/RedeemFlows.java)

First, let's have a diagram that sums up this flow:

![RedeemFlows CDL](/first-code/cdl_redeem_tokens.png)

Once more, let's focus on what is different.

What the redeem **initiator** flow does in a nutshell is:

1. Collect the required information.
2. Generate the transaction.
3. Verify it.
4. Sign the transaction.
5. Collect signatures from all holders and issuers.
6. Request a signature from the notary.
7. Send it over to all holders and issuers.

Sounds a lot like the `MoveFlows.Initiator`, with issuers that matter this time. And all our redeem **responder** flow does is:

1. Sign the transaction.
2. Accept the fully signed transaction.

And this time, all parties are signers, no need to differentiate between signers and mere participants.

The following new design decisions were taken:

* The `Initiator` constructor takes a very prescriptive list of inputs, for the same reason that it was done with `MoveFlows`. All the states passed will be redeemed.
* Any input holder or issuer can initiate the flow.
* There is an unsafe, but `abstract` `Responder`, in order to demonstrate an example of action that can be taken at the node level to fit a workflow while forcing the developer to create a safe child class.
* This `Responder` flow is not annotated with `@InitiatedBy`, so that only a decisive action can enable the link. This does not prevent a safer child class of `Responder`, or another implementation entirely, to be later annoted with `@InitiatedBy` if so required.

## `Initiator`

The class declaration is unremarkable by now.

### The fields

You will recognize them from `MoveFlows`:

```java
@NotNull
private final List<StateAndRef<TokenState>> inputTokens;
@NotNull
private final ProgressTracker progressTracker;
```
There are no output tokens, remember, all are redeemed.

With these fields, the 2 constructors will look familiar. The declaration of the `call` function too.

### Generating the transaction

If you followed `MoveFlows`, you will recognize the same actions with regards to the notaries. Here too it then gather the distinct signers:

```java
final Set<Party> allSigners = inputTokens.stream()
        .map(it -> it.getState().getData())
        .flatMap(it -> Stream.of(it.getIssuer(), it.getHolder()))
        .collect(Collectors.toSet());
```
With the extra twist that it needs both issuer and holder. If you do not understand `.flatMap`, picture the array equivalent, instead of obtaining a nested array (or stream), which `.map` would yield:

```javascript
[ [ issuer1, holder1 ], [ issuer2, holder2 ], ... ]
```
When you use `.flatMap`, you get a flattened array:

```javascript
[ issuer1, holder1, issuer2, holder2, ... ]
```
Creating the command, creating the transaction builder, adding the inputs, verifying the transaction and signing it locally should no longer be mysterious. Neither should be the collecting of signatures from all other peers, if there are any. Nor the finalisation. What is there new to discover?

With this, let's move to the `Responder` and confirm that it follows this rather simple choreography.

## `Responder`

### The class declaration

Ah something different:

```java
abstract class Responder extends FlowLogic<SignedTransaction> {
```
It also misses the `@InitiatedBy` annotation. This, combined with the `abstract` keyword really forces the developer to think about what they want to respond with. So what is it that it wants to developer to do?

```java
protected abstract void additionalChecks(@NotNull final SignedTransaction stx) throws FlowException;
```
This `abstract` function looks suspiciously like none other than `SignTransactionFlow`'s own abstract function:

```kotlin
@Throws(FlowException::class)
protected abstract fun checkTransaction(stx: SignedTransaction)
```
And with reason as you will see.

### Signing the transaction

Indeed the first thing that the `Responder` has to do is sign the transaction, by, as usual, creating the responder flow of `CollectSignaturesFlow`:

```java
final SignTransactionFlow signTransactionFlow = new SignTransactionFlow(counterpartySession) {
    @Override
    protected void checkTransaction(@NotNull final SignedTransaction stx) throws FlowException {
        additionalChecks(stx);
        [...]
```
And as expected, the `additionalChecks` is called so that the extra checks by the developer can be added. Then it follow with the classic check whereby the node's signature must be required.

When the flow has been instantiated, and only instantiated, it is time to run it:

```java
final SecureHash txId = subFlow(signTransactionFlow).getId();
```

### Finalising

A classic case:

```java
return subFlow(new ReceiveFinalityFlow(counterpartySession, txId));
```
By the way, if you recall back in `IssueFlows.Responder`, it did not have any `txId` to pass to `ReceiveFinalityFlow`. Does it matter? For `MoveFlows` and `RedeemFlows`, yes it does. If you think adversarially, you can imagine that the initiator could try to pull a bait-and-switch on the responder flow. It could ask it to sign a valid transaction, and then send an entirely different transaction to its vault. On top of spam, that could have serious side-effects, especially if your responder flow interacts with other systems.

This is why it passes the expected transaction id. In the case of the `IssueFlows`, even if the initiator sent a `txId`, it could be anything really, the responder would have no way of knowing whether it means anything. So expecting the `txId` ahead of time does not decrease your vulnerability.

### [Tests](https://github.com/corda/corda-training-code/blob/master/020-first-token/workflows/src/test/java/com/template/flows/RedeemFlowsTests.java)

Once again, the tests are pretty run of the mill. They check that:

* The transaction created is as expected, which includes:
    * Signatures.
    * Inputs.
* The transaction has been recorded in vaults.
* States have been consumed in vaults.

But before that is possible, you need to implement a [concrete child class of `Responder`](https://github.com/corda/corda-training-code/blob/master/020-first-token/workflows/src/test/java/com/template/flows/RedeemFlowsTests.java#L52). This is the role of:

```java
private static class UnsafeResponder extends RedeemFlows.Responder {
```
Which unsurprisingly does no additional checks:

```java
@Override
protected void additionalChecks(@NotNull SignedTransaction stx) {
}
```
The test then makes it the [default responder for 3 of the 4 mocked nodes](https://github.com/corda/corda-training-code/blob/master/020-first-token/workflows/src/test/java/com/template/flows/RedeemFlowsTests.java#L44-L49).

```java
it.registerInitiatedFlow(RedeemFlows.Initiator.class, UnsafeResponder.class);
```
The 4th mocked node uses [another child class of `Responder`](https://github.com/corda/corda-training-code/blob/master/020-first-token/workflows/src/test/java/com/template/flows/RedeemFlowsTests.java#L290):

```java
private static class SkintResponder extends RedeemFlows.Responder {
    private final long MAX_QUANTITY = 20L;
```
Which has a very peculiar extra check:

```java
final boolean lowEnough = stx.toLedgerTransaction(getServiceHub(), false)
        .inputsOfType(TokenState.class).stream()
        .filter(it -> it.getHolder().equals(getOurIdentity()))
        .allMatch(it -> it.getQuantity() <= MAX_QUANTITY);
if (!lowEnough) throw new FlowException("Quantity must not be too high.");
```
Yes, it fails when their amount is too high.

## Chaining

Ok, you have seen a bunch of flows that do very mechanical actions. In hindsight, they take properly prepared information, then act on it as expected. When you get the hang of it, that boringly comes down to _yet another flow_.

Indeed, `RedeemFlows.Initiator` and `RedeemFlows.Responder` were a bit boring. Not really boring, but well, what else did you learn that you did not already learn with `MoveFlows`?

How about introducing some non-mechanical elements?

You remember that the `Initiator` is very prescriptive with its inputs. It wants an arduously exact list, and will redeem all of them.

1. What if you want to help yourself with finding the proper `StateAndRef` given simple things like `issuer`, `holder` and total `quantity` to redeem?
2. What if you want to redeem a quantity of 100 tokens and you have 2 tokens instances, one of quantity 50 and the other of quantity 75? Redeeming a single one is not enough, redeeming both is too much.

So here comes the [`SimpleInitiator`](https://github.com/corda/corda-training-code/blob/master/020-first-token/workflows/src/main/java/com/template/flows/RedeemFlows.java#L324-L325):

1. It will take simple inputs like `Party` and `long`, and will convert that to `List<StateAndRef<TokenState>>`.
2. It will take care of any splitting and merging (a `Move`) necessary to obtain the exact sum, and some change for its own node, before redeeming.

_Simple_ is in reference to its eventual usage...

What it will do in order is:

1. Collect the required information.
2. Fetch enough states from the vault.
3. Make a `Move` transaction if necessary.
4. Keep the _change_ for itself if relevant.
5. Hand over to `Initiator` the exact states to be redeemed.

Since it will create 1 or 2 transactions, it is declared as:

```java
@StartableByRPC
class SimpleInitiator extends FlowLogic<Pair<SignedTransaction, SignedTransaction>> {
```
That's right, it returns a pair of transactions, the first being the optional move, and the second, the redemption.

This flow is not `@Initiating` and it has no tailored responder. Instead it prepares a bit then passes it on to `Initiator`, which knows how to handle all the possible cases. Also, you will need to suspend disbelief when it uses the vault as this is something that is covered later. Expandable panels mark the optional parts where you do not need to dig deep if you don't want to. The point here is to show:

* Flow chaining.
* That other flows can be simple and use complex flows.

{{<ExpansionPanel title="Optional rabbit hole">}}

### `StateAccumulator`

Before moving on, let's look at what _fetch enough states_ means. It means that you have a **minimum quantity** in mind, and you are going to accumulate **states** until the **sum** of **quantities** is equal to or above this minimum.

The purpose of `class StateAccumulator` is to assist you with that. It has a few fields of interest:

```java
final public long sum;
@NotNull
final public List<StateAndRef<TokenState>> states;
```
And the function that accumulates a new state only if it still needs to:

```java
@NotNull
public StateAccumulator plusIfSumBelow(@NotNull final StateAndRef<TokenState> state, final long maxSum) {
    if (maxSum <= sum) return this;
    else return plus(state);
}
```
If you look into the `plus` function, you will see that it covers the overflow case:

```java
@NotNull
public StateAccumulator plus(@NotNull final StateAndRef<TokenState> state) {
    final List<StateAndRef<TokenState>> joined = new ArrayList<>(states);
    joined.add(state);
    return new StateAccumulator(
            Math.addExact(sum, state.getState().getData().getQuantity()),
            joined);
    }
```

{{</ExpansionPanel>}}

### `SimpleInitiator` constructor

It takes the simple parameters mentioned earlier:

```java
public SimpleInitiator(
        @NotNull final Party notary,
        @NotNull final Party issuer,
        @NotNull final Party holder,
        final long totalQuantity) {
```
And with this, it creates a vault search criteria:

```java
this.tokenCriteria = new QueryCriteria.VaultQueryCriteria()
        .withParticipants(Collections.singletonList(holder))
        .withNotary(Collections.singletonList(notary));
```

{{<ExpansionPanel title="Optional rabbit hole">}}

### The fetch function

When you fetch states from the vault, you are limited to 200 states. That's a lot, but it may not be enough. In any case, you need to use pagination, and for that, here recursion is used, whereby it will call the same function for the next page if it did not accumulate enough yet. The function is declared as:

```java
private StateAccumulator fetchWorthAtLeast(
        final long remainingSum,
        @NotNull final PageSpecification paging) throws FlowException {
```
And you can look into its body, but basically it:

1. Fetches some from the vault.
2. Loads the result into a `StateAccumulator` instance.
3. If needed calls itself recursively and adds the (recursive) lot to its `StateAccumulator` instance.
4. Returns the `StateAccumulator` instance.

{{</ExpansionPanel>}}

### The optional move transaction

As you go into the `call` function:

```java
@Suspendable
@Override
public Pair<SignedTransaction, SignedTransaction> call() throws FlowException {
```
It fetches the necessary states:

```java
final StateAccumulator accumulated = fetchWorthAtLeast(totalQuantity);
```
Then you see that if it fetched too much, `accumulated.sum <= totalQuantity ?`:

```java
final SignedTransaction moveTx = accumulated.sum <= totalQuantity ? null :
        subFlow(new MoveFlows.Initiator(accumulated.states, Arrays.asList(
                new TokenState(issuer, getOurIdentity(), totalQuantity), // Index 0 in outputs.
                new TokenState(issuer, getOurIdentity(), accumulated.sum - totalQuantity))));
```

* If it did not get enough states, it has already failed in `fetchWorthAtLeast`.
* If it got the exact count, it does not move anything, so marks `moveTx = null;`
* If it got more than necessary, it does some merging and splitting. Notice that:
    * Because the node is the holder of inputs and outputs, there is no call to another peer, everything happens locally, which is convenient because there is no defined `@InitiatedBy`-default responder to `MoveFlows.Initiator`.
    * The `TokenState` that it intends to redeem is at index `0`.
    * The _change_ is at index `1`.

### Passing over to `MoveFlows.Initiator`

Now it needs to select the states to redeem, whether there was a `Move` or not:

```java
final List<StateAndRef<TokenState>> toUse = moveTx == null ? accumulated.states :
        Collections.singletonList(moveTx.getTx().outRef(0));
```
And it hands over to the proper `Initiator`:

```java
return new Pair<>(moveTx, subFlow(new Initiator(
        toUse,
        HANDING_TO_INITIATOR.childProgressTracker())));
```
That's right, it returns both transactions, with the first one perhaps `null`.

### [Tests](https://github.com/corda/corda-training-code/blob/master/020-first-token/workflows/src/test/java/com/template/flows/RedeemFlowsTests.java#L317)

Of course, you will also find tests for this `SimpleInitiator`, whereby tokens are issued, then fetched. They cover the cases where:

* It does not have enough tokens.
* It has the right count in the vault.
* It has more than needed in the vault and yet manages to fetch the right count.
* It fetches more than needed and makes a split.

## Conclusion

This bunch of `Redeem` flows should have given you some ideas as to how you can child-class or compose your flows.
