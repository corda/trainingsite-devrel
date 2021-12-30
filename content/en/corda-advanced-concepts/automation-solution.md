---
title: Automation Solution
description: Where the buyer always has the latest car info
slug: automation-solution
menu:
  main:
    parent: corda-advanced-concepts
    weight: 100  
weight: 100
---

In the previous chapter, you learned about schedulable events and services, each with an exercise for you to complete. Make sure you have worked on your own before looking below for a solution.

To follow along with IntelliJ, you need to open the [`070-services`](https://github.com/corda/corda-training-code/tree/master/070-services) folder as a project.

## Schedulable event

The point of the exercise was to inform the vault that the seller wants to reject the proposal as soon as it expires. There are a couple flows to reject a proposal. The decision was made to use the one that takes a `SalesProposal` id and the rejecter:

```java
public RejectSimpleFlow(
        @NotNull final UniqueIdentifier proposalId,
        @NotNull final AbstractParty rejecter) {
```
So, the `SalesProposal` state was made schedulable:

```java
public class SalesProposal implements LinearState, SchedulableState {
```
Which means it had to implement:

```java
@NotNull
@Override
public ScheduledActivity nextScheduledActivity(
        @NotNull final StateRef thisStateRef,
        @NotNull final FlowLogicRefFactory flowLogicRefFactory) {
    return new ScheduledActivity(
            flowLogicRefFactory.create(SCHEDULED_FLOW, linearId, seller),
            expirationDate.plus(Duration.ofSeconds(1)));
}
```
Where the name of the flow is:

```java
    public static final String SCHEDULED_FLOW = "com.template.proposal.flow.SalesProposalRejectFlows$RejectSimpleFlow";
```
The reason why the flow has to be called by name is because it is defined in the _workflow_ module, which is unknown from this _contract_ module.

This also means that both the seller's and the buyer's vaults would attempt to reject, but only the seller's vault has the seller's key. Therefore the flow had to be adjusted:

```java
if (!getServiceHub().getKeyManagementService().filterMyKeys(
        Collections.singleton(rejecter.getOwningKey())).iterator().hasNext()) {
    throw new FlowException("Rejecter key unknown");
}
```
To give a meaningful error on the buyer's node. What `.filterMyKeys` does is keep the public keys with private keys that are known to the nodes.

Why not have the `SalesProposal` itself filter, and return `null` on the buyer's vault? Well, the state itself does not have access to the vault, so the verification needs to happen downstream.

## Schedulable tests

The tests have also been modified. Actually, this gets a bit tricky. The reject flow tests have been split into 2 files, each with a different initialisation:

* In the existing one, reject flows are tested as if there were no schedulable actions.
* In the new one, the mock network is initialized:
    * With an extra parameter: `.withThreadPerNode(true)`.
    * Every `network.runNetwork()` have been replaced by [`network.waitQuiescent()`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/testing/node-driver/src/main/kotlin/net/corda/testing/node/MockNetwork.kt#L389-L390).

When discovering tests on the `cordapp-example`, you were already introduced to the fact that you can count how many times you need to _pump_ the network with `.runNetwork(count)` for your flow to complete. This new `.waitQuiescent` is more sensitive in that, as the name suggests, it waits for all activity to settle down.

Use `.waitQuiescent` only when necessary, as this slows down your flow tests, which are not especially fast to begin with. This is also the reason why those reject flow tests are now split into two.

## Service

The point of this exercise was to inform the potential buyer of a change in information on the car.

## How to inform

The buyer needs to receive the new `CarTokenType` state, and save it to their vault. For that, the best choice is the `SignedTransaction`-flavored `DataVendingFlow`: `SendTransactionFlow`.

The `InformTokenBuyerFlows` flow pair has:

* The initiating `Send` flow.
* The responding `Receive` flow.

Since this is not your first <del>rodeo</del> flow, there is no need to say too much. The `Send` flow requires the strictly necessary inputs:

```java
public Send(@NotNull final AbstractParty buyer,
            @NotNull final SignedTransaction tx,
            @NotNull final ProgressTracker progressTracker) {
```
Resolves the buyer's host:

```java
final Party buyerHost = getServiceHub().getIdentityService()
        .requireWellKnownPartyFromAnonymous(buyer);
final FlowSession buyerSession = initiateFlow(buyerHost);
```
Then sends the buyer information, for verification purposes, and the transaction:

```java
buyerSession.send(buyer);
subFlow(new SendTransactionFlow(buyerSession, tx));
```
Then, this is not necessary, but nice to allow bubbling up of exceptions, it expects to receive an ok of some sort:

```java
buyerSession.receive(String.class).unwrap(it -> it);
```
You will see that, on the buyer's side, relevant checks are done after all information has been received, i.e. after the initiator is done with sending all information. This means that the `FlowSession` has been closed from the initiator's end. If at this point, the responder attempts to send back a `FlowException`, it will not work, leaving the initiator in the dark about it.

On the buyer side, expectedly:

```java
final AbstractParty buyer = sellerSession.receive(AbstractParty.class).unwrap(it -> it);
```
If this flow accepted each and every transaction sent, it would be an avenue for a vault-spamming attack. So here comes the first verification.

```java
if (!getServiceHub().getKeyManagementService()
        .filterMyKeys(Collections.singletonList(buyer.getOwningKey())).iterator().hasNext())
    throw new FlowException("This buyer is not hosted here");
```
What `filterMyKeys` does is return only the keys whose private key can be found. If it is empty, it means that no key could be resolved, i.e. that the buyer is not hosted on this node. Next, it is time to receive the transaction proper:

```java
final SignedTransaction tx = subFlow(new ReceiveTransactionFlow(sellerSession));
```
But is it relevant? This flow is used to send updates on an evolvable token type, like `CarTokenType`:

```java
final List<UniqueIdentifier> outputIds = tx.getCoreTransaction().outputsOfType(EvolvableTokenType.class)
        .stream()
        .map(EvolvableTokenType::getLinearId)
        .collect(Collectors.toList());
if (outputIds.isEmpty()) throw new FlowException("No EvolvableTokenType, stopping");
```
Associated with a `SalesProposal` of the quoted buyer:

```java
if (!isRelevant(buyer, outputIds))
    throw new FlowException("There is no SalesProposal here for this transaction");
```
Where `isRelevant` fetches all the `SalesProposal` with which the buyer is involved, and checks if any is pointing to one of the newly received information:

```java
private boolean isRelevant(
        @NotNull final AbstractParty buyer,
        @NotNull final List<UniqueIdentifier> outputIds) throws TransactionResolutionException {
    // Do we have a SalesProposal with the seller?
    final List<StateAndRef<SalesProposal>> states = getServiceHub().getVaultService().queryBy(
            SalesProposal.class,
            new QueryCriteria.LinearStateQueryCriteria().withParticipants(Collections.singletonList(buyer)))
            .getStates();
    boolean relevant = false;
    // Because of the checked exception, we cannot use .stream().
    for (StateAndRef<SalesProposal> salesProposalStateAndRef : states) {
        final TokenType it = extractTokenType(salesProposalStateAndRef);
        // You have to account for the fact that some SalesProposals may use a fixed TokenType.
        if (it.isPointer()) {
            //noinspection unchecked
            final UniqueIdentifier linearId = ((TokenPointer<EvolvableTokenType>) it).getPointer()
                    .resolve(getServiceHub())
                    .getState().getData().getLinearId();
            if (outputIds.contains(linearId)) {
                relevant = true;
                break;
            }
        }
    }
    return relevant;
}
```

```java
getServiceHub().recordTransactions(StatesToRecord.ALL_VISIBLE, Collections.singleton(tx));
sellerSession.send("Ok");
```
When satisfied, it is time to record and send an "Ok". The state is forced to be recorded because it is not a participant to the transaction. Otherwise it would have received it in the first place, after all. With this final "Ok" sent, the flow session can finally be closed.

## How to monitor

This is where the service comes into play. It has to be declared:

```java
@CordaService
public class SalesProposalService extends SingletonSerializeAsToken {
```
It keeps locally relevant data for its operation. Sufficiently generic to be used with types other than `CarTokenType`:

```java
@NotNull
private final Map<StateAndRef<? extends EvolvableTokenType>, List<AbstractParty>> trackedTypesToBuyers;
```
Where:

* The key is the _`CarTokenType`_ that has been offered in a `SalesProposal`.
* The values are the potential buyers. It has to be a list because the service is not in control of how many times the same car is offered.

## Simple functions

The service declares a number of boilerplate functions that are used by the more interesting functions. Have a look at them if you are interested.

{{<ExpansionPanel title="Boilerplate functions">}}

The service declares a number of boilerplate functions that are used by the more interesting functions. Notice how they are `public` as they do not modify the service's state.

{{<ExpansionPanelList>}}
{{<ExpansionPanelListItem number="1">}}

#### Information about what is being tracked

```java
public int getTokenTypeCount() {
    return trackedTypesToBuyers.size();
}

@Nullable
public List<AbstractParty> getBuyersOf(@NotNull final StateAndRef<? extends EvolvableTokenType> tokenType) {
    return trackedTypesToBuyers.get(tokenType);
}
```

{{</ExpansionPanelListItem>}}
{{<ExpansionPanelListItem number="2">}}

#### Forced conversion of a generic

```java
@NotNull
public StateAndRef<EvolvableTokenType> convertToType(@NotNull final StateAndRef<ContractState> state) {
    return new StateAndRef<>(
            new TransactionState<>(
                    (EvolvableTokenType) state.getState().getData(),
                    state.getState().getContract(),
                    state.getState().getNotary(),
                    state.getState().getEncumbrance(),
                    state.getState().getConstraint()),
            state.getRef());
}
```

{{</ExpansionPanelListItem>}}
{{<ExpansionPanelListItem number="3">}}

#### Content extraction

```java
@Nullable
public StateAndRef<EvolvableTokenType> getTokenType(@NotNull final SalesProposal proposal)
        throws TransactionResolutionException {
    final TokenType type = proposal.getAsset().resolve(serviceHub).getState().getData().getTokenType();
    if (!type.isPointer()) return null;
    //noinspection unchecked
    return ((TokenPointer<EvolvableTokenType>) type)
            .getPointer()
            .resolve(serviceHub);
}
```
It has to account for the fact that some `SalesProposal`s may have an asset with a fixed `TokenType`.

{{</ExpansionPanelListItem>}}
{{<ExpansionPanelListItem number="4">}}

#### Ability to know if a key is relevant

```java
public boolean isMyKey(@NotNull final AbstractParty who) {
    return serviceHub.getKeyManagementService()
            .filterMyKeys(Collections.singletonList(who.getOwningKey()))
            .iterator()
            .hasNext();
}
```
Which mirrors what was found in the flow above.

{{</ExpansionPanelListItem>}}
{{<ExpansionPanelListItem number="5">}}

#### Additional logger

```java
private final static Logger log = LoggerFactory.getLogger(SalesProposalService.class);
```
To facilitate logging with headers and such.

{{</ExpansionPanelListItem>}}
{{</ExpansionPanelList>}}
{{</ExpansionPanel>}}

The boilerplate allows simple functions that are needed for clarity, adding to the tracking:

```java
private void putProposal(@NotNull final SalesProposal proposal) throws TransactionResolutionException {
    // If we are not the seller, we do not need to watch.
    if (!isMyKey(proposal.getSeller())) return;
    final StateAndRef<EvolvableTokenType> tokenType = getTokenType(proposal);
    // If it is not evolvable, there is nothing to track.
    if (tokenType == null) return;
    final List<AbstractParty> buyers = trackedTypesToBuyers.get(tokenType);
    if (buyers == null) {
        trackedTypesToBuyers.put(tokenType, new ArrayList<>(Collections.singletonList(proposal.getBuyer())));
    } else {
        buyers.add(proposal.getBuyer());
    }
}
```
Notice how it makes sure not to add unnecessary elements to tracking. In particular:

* It is the seller that is meant to track, so as to inform the buyer. The reverse is not necessary.
* There is no need to track non-evolvable token types.

Remember, to be able to remove the proposal from the tracking:

```java
private void removeProposal(@NotNull final SalesProposal proposal) throws TransactionResolutionException {
    final StateAndRef<EvolvableTokenType> tokenType = getTokenType(proposal);
    // If it is not evolvable, nothing was tracked in the first place.
    if (tokenType == null) return;
    trackedTypesToBuyers.remove(tokenType);
}
```

## Track and notify

Ok, time for the meat of the subject. As part of its tracking, the service needs to be updated by updates from the vault. For this, the tool is `getVaultService().trackBy`. Ideally, you would run 2 such `.trackBy`:

* One for `SalesProposal`.
* The other for `EvolvableTokenType`.

In practice, in a single service, these 2 `trackBy` are competing for the database connection, so a single one, on `ContractState` has to be used. Another potential pitfall is that if you do not provide any `QueryCriteria`, then a [default one](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/node/services/VaultService.kt#L455-L456) will be made. And the default one is for [`Vault.StateStatus.UNCONSUMED`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/node/services/vault/QueryCriteria.kt#L143) states. Recall the reject transaction? It consumes a single state and has no output. If it relied on the default query critera, this transaction would be missed.

Additionally, although `trackBy` gives you updates, it does not tell you about the state of the database at the start. So you need to add a `queryBy` too, this one specifically for `SalesProposal` since `CarTokenType`s alone are not enough.

Plus, to mitigate the fact that updates may have arisen between the time you `queryBy` and the time you `trackBy`, it is advisable to start with `trackBy`. So here it is:

```java
private void trackAndNotify() {
    serviceHub.getVaultService()
            .trackBy(
                    ContractState.class,
                    new QueryCriteria.VaultQueryCriteria(Vault.StateStatus.ALL))
            .getUpdates().subscribe(
            this::handleUpdate,
            error -> log.error("In ContractState tracking", error),
            () -> log.info("ContractState updates closed!"));
    serviceHub.getVaultService().queryBy(SalesProposal.class).getStates()
            .forEach(it -> {
                try {
                    putProposal(it.getState().getData());
                } catch (TransactionResolutionException e) {
                    log.error("Failed to resolve asset", e);
                }
            });
}
```
Because of the `StaticPointer` it alway runs the risk of failing to resolve a transaction hash. Better not stop the process in this case.

If the `.subscribe(onNext, onError, onDone)` bit looks unfamiliar to you, have a look at [RxJava](https://github.com/ReactiveX/RxJava/wiki). That will serve you well beyond this course.

As you can see, the `queryBy` starts by populating the existing `SalesProposal`s using the `putProposal` function covered earlier. Now, have a look at `this::handleUpdate`.

## Handle updates

Where you dispatch actions.

```java
private void handleUpdate(@NotNull final Vault.Update<ContractState> update) {
    final Map<UniqueIdentifier, StateAndRef<EvolvableTokenType>> toNotify = new HashMap<>();
    update.getConsumed().forEach(it -> {
        if (it.getState().getData() instanceof SalesProposal) {
            try {
                removeProposal((SalesProposal) it.getState().getData());
            } catch (TransactionResolutionException e) {
                log.error("Failed to resolve asset", e);
            }
        } else if (it.getState().getData() instanceof EvolvableTokenType) {
            final StateAndRef<EvolvableTokenType> consumed = convertToType(it);
            if (trackedTypesToBuyers.get(consumed) != null) {
                final UniqueIdentifier id = consumed.getState().getData().getLinearId();
                assert toNotify.get(id) == null; // Because it should be the first time we see it.
                toNotify.put(id, consumed);
            }
        }
    });
    toNotify.forEach((id, state) -> {
        if (trackedTypesToBuyers.get(state) == null) toNotify.remove(id);
    });
    update.getProduced().forEach(it -> {
        if (it.getState().getData() instanceof SalesProposal) {
            try {
                putProposal((SalesProposal) it.getState().getData());
            } catch (TransactionResolutionException e) {
                log.error("Failed to resolve asset", e);
            }
        } else if (it.getState().getData() instanceof EvolvableTokenType) {
            final StateAndRef<EvolvableTokenType> produced = convertToType(it);
            final StateAndRef<EvolvableTokenType> consumed = toNotify.get(produced.getState().getData().getLinearId());
            if (consumed != null) {
                trackedTypesToBuyers.put(produced, trackedTypesToBuyers.get(consumed));
                notifyUpdate(consumed, produced);
                toNotify.remove(consumed.getState().getData().getLinearId());
            }
        }
    });
    toNotify.forEach((key, value) -> trackedTypesToBuyers.remove(value));
}
```
Ok, it is admittedly a bit chunky. You have to understand, a `Vault.Update` has [many attributes](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/node/services/VaultService.kt#L51-L61), but those of interest here are consumed states, and produced states. And, only those of the relevant types. Remember that it would have been pleasant to launch 2 `trackBy`, but this luxury was not available.

The easy bit is what to do about `SalesProposal`:

* Produced -> `putProposal`
* Consumed -> `removeProposal`

For the `EvolvableTokenType`s, it is more involved. The unicity guide for those is their linear id. So

* When a type appears only in `produced`, it means it is new and was not tracked.
* When a type was consumed and was tracked, its replacement needs to be sent over.

That's why it starts by looking into `consumed`. But because it looks at all `consumed` first, then only does it look at all `produced`, it needs to keep the information from one loop to the next. That's the role of the map:

```java
// Map key: EvolvableTokenType linear id
// Map value: Tracked and consumed EvolvableTokenType
final Map<UniqueIdentifier, StateAndRef<EvolvableTokenType>> toNotify = new HashMap<>();
```
When it finds a consumed type that fits the bill, it is added:

```java
if (trackedTypesToBuyers.get(consumed) != null) {
    final UniqueIdentifier id = consumed.getState().getData().getLinearId();
    assert toNotify.get(id) == null; // Because it should be the first time we see it.
    toNotify.put(id, consumed);
}
```
When done with the consumed part, it still needs to account for the fact that perhaps a state was marked for notification when in fact, later in the loop, a `SalesProposal` removed it from the overall tracking. If this was so, there is no point in keeping this state for the next part of the function. Hence the cleanup:

```java
toNotify.forEach((id, state) -> {
    if (trackedTypesToBuyers.get(state) == null) toNotify.remove(id);
});
```

After that, while looping through the produced ones, it decides to notify if it finds a match in the _curated_ consumed map:

```java
final StateAndRef<EvolvableTokenType> produced = convertToType(it);
final UniqueIdentifier id = produced.getState().getData().getLinearId();
final StateAndRef<EvolvableTokenType> consumed = toNotify.get(id);
if (consumed != null) {
    trackedTypesToBuyers.put(produced, trackedTypesToBuyers.get(consumed));
    notifyUpdate(consumed, produced);
    toNotify.remove(id);
}
```
Because the `SalesProposal` is still on, it makes sense to keep tracking but on the newly produced state.

You know that at the current stage of the Tokens SDK it is not possible for an `EvolvableTokenType` to completely exit the ledger since there is no destroy command for it. However, if such a command is created in the future, this service aims to be ready. That's why the function ends with _forgetting_ the unlikely remainders:

```java
toNotify.forEach((key, value) -> trackedTypesToBuyers.remove(value));
```
Now, what is `notifyUpdate`?

## Push the information

Pushing the information to the buyers is, unsurprisingly, the role of `notifyUpdate`:

```java
private void notifyUpdate(
        @NotNull final StateAndRef<EvolvableTokenType> consumed,
        @NotNull final StateAndRef<EvolvableTokenType> replacement) {
    final UniqueIdentifier stateId = consumed.getState().getData().getLinearId();
    final List<AbstractParty> buyers = trackedTypesToBuyers.get(consumed);
    final SignedTransaction tx = serviceHub.getValidatedTransactions().getTransaction(
            replacement.getRef().getTxhash());
    assert buyers != null;
    assert tx != null; // Should never happen.
    for (final AbstractParty buyer : buyers)
        executor.execute(() ->
                serviceHub.startTrackedFlow(new InformTokenBuyerFlows.Send(buyer, tx))
                        .getProgress()
                        .subscribe(
                                result -> log.info("Notified buyer " + buyer + " of change of " + stateId +
                                        "with result " + result),
                                e -> log.error("Failed to notify buyer " + buyer + " of change of " + stateId, e),
                                () -> trackedTypesToBuyers.remove(consumed)
                        ));
}
```
Another chunky one. It starts inconspicuously by gathering the required information:

* The buyers as per the tracking.
* The transaction that executed the `EvolvableTokenType` replacement.

Then, it hands over to the `InformTokenBuyerFlows.Send` flow. Note the use of an `executor`. For an in-depth explanation, look [here](https://lankydan.dev/2018/10/05/starting-flows-with-trackby). In short, flows, via checkpoints, block the thread on which they are running which would mean blocking the service right there. Not to mention that the service is meant to not be serialized because of `SingletonSerializeAsToken`...

So the service offloads these actions to an executor with a number of threads and hopes for the best. This was not tested under load.

As a side-note, `serviceHub.startTrackedFlow` was used instead of `serviceHub.startFlow` in order to receive updates. In particular, when it is done so that the service may stop tracking the consumed state:

```java
() -> trackedTypesToBuyers.remove(consumed)
```

And, there you have it. The service that keeps buyers informed, informs only those that are meant to be kept informed.

## Tests

1. [`InformTokenBuyerFlowsTests`](https://github.com/corda/corda-training-code/blob/master/070-services/workflows/src/test/java/com/template/proposal/flow/InformTokenBuyerFlowsTests.java) test:

    * That the flow fails when given the wrong transaction.
    * That it stores the state on success.
2. [`SalesProposalServiceTests`](https://github.com/corda/corda-training-code/blob/master/070-services/workflows/src/test/java/com/template/proposal/service/SalesProposalServiceTests.java) test:

    * That the service does not track irrelevant data.
    * That it tracks relevant data.
    * That the the buyer is informed.
    * That it no longer tracks when the proposal is reject by the buyer.
3. [`SalesProposalServiceAndSchedulableTests`](https://github.com/corda/corda-training-code/blob/master/070-services/workflows/src/test/java/com/template/proposal/service/SalesProposalServiceAndSchedulableTests.java) test:

    * That the service no longer tracks when the proposal is automatically deleted by the seller's schedulable event. Talk about automation...
    * Here too, it has to use `network.waitQuiescent`.

## Conclusion

You learned how to code a service while learning a bit more about the vault, executors and the mock network.
