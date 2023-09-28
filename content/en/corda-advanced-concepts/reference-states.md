---
title: Reference States
description: Use states without destroying them
slug: reference-states
aliases: [
  "/corda-details/reference-states/"
]
menu:
  main:
    parent: corda-advanced-concepts
    weight: 20
weight: 20
---


{{<ExpansionPanel title="Code">}}

You may want to do the practical parts of this chapter on top of: https://github.com/corda/corda-training-code/tree/master/040-accounts-lib

{{</ExpansionPanel>}}

So far in this training, when the subject of states has been mentioned, you have read and read again that they can be consumed as transaction inputs and can only be consumed once. That is still true and your world is not going to collapse. When a state is data that evolves, like tokens changing hands or an obligation that gets refunded, then it makes perfect sense to consume and move on. Plus, you avoid double-spending.

## Improving the IOU CorDapp

However, what if you have some _reference_ data that is useful and reusable. That is, data that you want to be valid and certified, and you want to make use of it without _destroying_ or consuming it.

An example that comes to mind is KYC, short for requesting paperwork in order to Know Your Customer. Imagine that a reputable company, EzKyc, handles this paperwork and certifies parties or accounts on the ledger. EzKyc issues small `KYC` states on the ledger whereby they vouch that the `AbstractParty customer` is a legitimate, known person or entity. You, as the creator of an IOU CordDapp want to protect your users, and facilitate transactions between legitimate parties, especially when creating an IOU.

Your first thought is to have the IOU flow create a transaction that takes a number of `KYC` states in inputs, and adds, along the IOU state, the same KYC states in output, thereby not _really_ destroying them. However, by doing so, you invalidated the `StateAndRef` references other parties had about these KYC states. If these other parties want to transact, with any CorDapp, not just your IOU one, they'd have to be informed about the new state. That's increasing the risk of *race conditions* on perfectly acceptable uses of these KYC states.

You need data that is verifiable, and yet not consumed in a transaction. You need a way to express and use reference data.

Reference data can be seen as reusable pieces of information that parties of a transaction rely on to work out the outcome. It can be something as simple as currency codes, which seldom change, or as elaborate as KYC data, which rely on complicated processes to gather up-to-date data and maintain their integrity.

Using a distributed ledger adds complexity to reference data. How is it maintained, and by whom? How to ensure that your version is the latest one?

## Reference data options

Prior to reference states, Corda already had ways to provide reference data to transactions. Each had its own limitations:

### Attachments

You saw them in a previous chapter. Attachments are an important feature, for instance they ensure a deterministic outcome of transaction validation in any point of time by allowing to add the contracts `jar` files as an attachment. However for reference data it has the following caveats:

* There's no way to assert that the attachment holds the most current data. Remember that you're dealing with a distributed ledger. A node might be using a version of the attachment that another node considers outdated.
* You're dealing with files, so you have to fetch that file, open it, and parse its contents to get access to the data. And, obviously, for each file you would have to parse it differently. That's not very practical!

### Oracles

Similar to attachments, oracles add the burden of different implementations for different classes of reference data. Plus, they also introduce unnecessary and likely undesirable centralisation because you rely on a 3rd party to provide you with the up-to-date reference data. You will learn about oracles in more detail in a later chapter.

### Off-ledger data providers

This one is pretty obvious. When you're dealing with off-ledger data you lose trust, because it is not immutable and cryptographically secured like on-ledger data. Plus, to get off-ledger data you have to make calls from inside of flows. As you know, contracts don't have access to external resources.

This shifts the transaction verification from the contract to the flow and defeats the deterministic security assurances of contracts. As you have seen in previous examples, any party can rewrite a flow to comply with its, potentially malicious, needs.

By the way, oracles are a subset of off-ledger data providers.

### Encumbrances

Encumbrance is a fancy word for _burden_. In the world of Corda, encumbrances is a great feature, whereby an _encumbered_ state is forced to be consumed alongside its _encumbrance_, which is just another state. But, this doesn't work for reference data for the following reasons:

* There's a tight coupling between the 2 states: they have to be created in the same transaction by [pointing at the encumbrance index](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/transactions/TransactionBuilder.kt#L748). Not exactly what a reference data should look like.
* The encumbrance state must be consumed with the encumbered state, in the same transaction. This means your reference data can be only consumed by the encumbered state and no other transactions can.

We look at a useful usage of encumbrances in the chapter about time window.

### State Pointers

You came across state pointers when learning about `TokenPointer`. Pointers allow linking one state to another uni-directionally. If the referenced state is, say, linear, you can use a `LinearPointer`. Conceptually, it always points at its most recent version, and you can access the pointed state data by asking the vault to resolve the pointer. That sounds like a good approach for reference data.

Alas, _asking the vault_ is not something that is accessible to contracts. As far as contracts are concerned, the vault is external data. This forces you to delegate the validation of reference data to flows instead of contracts. Not ideal.

## Using reference states for reference data

All of the above Corda features are great when they're used for what they were designed for:

* Attachments for data that doesn't change or can't go into states like an Excel spreadsheet.
* Oracles for frequently changing data like current foreign exchange rates), and following that logic

To properly use reference data, Corda introduced the concept of **Reference States in a transaction**. Said another way, _regular_ states can be used as _references_ in transactions. This solves the problems that the previously discussed approaches have, and it surpasses them with the following capabilities:

* Reference states are, like the name implies, **states**. Which means that:
    * They are **immutable**.
    * They are **tracked** by the ledger.
    * They are readily accessible, unlike files that need to opened and parsed.
* When a state is added as a reference to a transaction, it is not consumed, instead it is left intact. Therefore other transactions can use the same reference state concurrently or later.
* As with all states, the notary checks whether the reference states are already marked as consumed, i.e. outdated, and signs off only when they are not. Therefore parties have assurance that they're using the latest version of the reference data.
* A state later used as a reference is still created like any other state. It thereby offers the same assurances with regards to its provenance trail.
* Reference states are decoupled from other states, and like any state they can be updated by their own list of maintainers through regular flows.
* When used as a reference, a state's contract is not ran on transaction verification.
* Reference states are part of the transaction, which means they're accessible inside contracts where, as usual, verification outcomes are deterministic.

This leads to the only limitation of reference states.

## Known limitations

As you're aware, a transaction must have a single notary. All its states must name a single notary. If it were not so, it would open up the possibility of double-spends, where an input state that was supposedly tracked by `NotaryA`, and already marked as consumed there, is in fact being consumed again in a transaction that uses `NotaryB`. `NotaryB` would be unaware of what outcomes have already been determined in `NotaryA`.

So, if a reference state names a notary different from the other transaction inputs, then the only way forward, is by moving those inputs to the same notary as the reference state. Worse, if you have two reference states naming two different notaries, then you simply cannot commit that transaction to the ledger.

{{<HighlightBox type="tip">}}

Don't conflate:

* _state references_, of the likes of `StateRef` and `StateAndRef`,
* with _reference states_, which are states used as reference data.

{{</HighlightBox>}}

## Using Reference States

Let's upgrade the IOU CorDapp example with a simple `KYC` state made by EzKyc. The new requirement here is that in order to create an IOU, both the `lender` and the `borrower` must pass the KYC check. Start by creating a standard state:

```java
@BelongsToContract(KYCContract.class)
public class KYCState implements LinearState {

    @NotNull
    private final UniqueIdentifier linearId;
    @NotNull
    private final Party issuer;
    @NotNull
    private final Party customer;
    private final boolean valid;

    @ConstructorForDeserialization
    public KYCState(@NotNull final UniqueIdentifier linearId,
               @NotNull final Party issuer,
               @NotNull final Party customer,
               final boolean valid) {
        this.linearId = linearId;
        this.issuer = issuer;
        this.customer = customer;
        this.valid = valid;
    }

    public KYCState(@NotNull final Party issuer,
               @NotNull final Party customer,
               final boolean valid) {
        this.linearId = new UniqueIdentifier();
        this.issuer = issuer;
        this.customer = customer;
        this.valid = valid;
    }

    @NotNull
    @Override
    public UniqueIdentifier getLinearId() {
        return linearId;
    }

    @NotNull
    @Override
    public List<AbstractParty> getParticipants() {
        return Arrays.asList(issuer, customer);
    }

    // Plus the remaining getters, equals(), and hashCode() methods.
}
```
Find the incomplete `KYCContract` [here](https://github.com/corda/corda-training-code/blob/master/050-ref-state/contracts/src/main/java/com/example/contract/KYCContract.java). Incomplete, as it leaves missing pieces to you as an exercise.

The issuer of the KYC state has to be reputable, or at least verifiable. Which is why, the desired issuer is added to the IOU state:

```java
private final Party kycIssuer;
```

Now, inside the `IOUContract`, it has to be made aware of this new `KYCState` state passed as a reference. Let's add some constraints:

```java
// KYC reference state constraints.
final Stream<KYCState> validKycData = tx.referenceInputRefsOfType(KYCState.class).stream()
        .map(it -> it.getState().getData())
        // Only the expected issuer.
        .filter(it -> it.getIssuer().equals(out.getKycIssuer()))
        // Valid one.
        .filter(KYCState::isValid);
require.using("Lender must have passed KYC check.", validKycData
        .anyMatch(it -> it.getCustomer().equals(out.getLender())));
require.using("Borrower must have passed KYC check.", validKycData
        .anyMatch(it -> it.getCustomer().equals(out.getBorrower())));
```
With the ledger elements covered, the business workflow has to be updated to account for the new reference state requirement. So, in `ExampleFlow` you first query for the KYC states:

```java
final QueryCriteria participantsKyc = new QueryCriteria.VaultQueryCriteria()
        .withParticipants(Arrays.asList(
                iouState.getBorrower(),
                iouState.getLender(),
                iouState.getKycIssuer()));
final List<StateAndRef<KYCState>> kycRefs = getServiceHub().getVaultService()
        .queryBy(KYCState.class, participantsKyc).getStates().stream()
        // Keep relevant ones
        .filter(it -> it.getState().getData().getIssuer().equals(iouState.getKycIssuer()))
        .collect(Collectors.toList());
// TODO less harsh test.
if (kycRefs.size() != 2)
    throw new FlowException("KYC data for IOU participants not found.");
```
Then, with the transaction builder:

```java
// Add KYC data as references to the transaction.
txBuilder.addReferenceState(kycRefs.get(0).referenced());
txBuilder.addReferenceState(kycRefs.get(1).referenced());
```
This completes the untested refactoring of the IOU CorDapp to use KYC reference states.

{{<HighlightBox type="info">}}

When you add a state as a reference, the transaction builder will [resolve the state pointers](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/transactions/TransactionBuilder.kt#L715) of this state, and [include the pointed states as references](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/transactions/TransactionBuilder.kt#L676) too.

For instance, if you include an NFT of your held car as a reference, the `CarTokenType` state will also be added as a reference.

In fact, when you made a transaction to sell the NFT of your car, the pointed `CarTokenType` state [was added as a reference](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/transactions/TransactionBuilder.kt#L727).

{{</HighlightBox>}}

## Conclusion

You learned that when it comes to reusable and verifiable data, you can use reference states.

## References (pun intended)

- [Video](https://www.youtube.com/watch?v=Nda-z4BgyI4) explaining reference states  .
- [Sample CorDapp](https://github.com/corda/samples-kotlin/tree/master/Features/referenceStates-sanctionsBody) on reference states.
- Reference states [limitation](https://docs.corda.net/docs/corda-os/4.3/api-states.html#reference-states).
- [State pointers](https://docs.corda.net/docs/corda-os/4.0/api-states.html#state-pointers).
- [Using attachments](https://docs.corda.net/docs/corda-os/4.3/tutorial-attachments.html).
