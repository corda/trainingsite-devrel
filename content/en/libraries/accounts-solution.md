---
title: Accounts Solution
description: Compare your solution to an example
slug: accounts-solution
menu:
  main:
    parent: libraries
    weight: 120
weight: 120
---


In the previous chapter, you worked on your project to make sure that your CorDapp is account-safe and account-aware. Now, compare your work to an example solution.

## Confirm the token flows

Here, you made your existing issue, move and redeem flows account safe. You can confirm this with unit tests.

### Preparation

Preparing your network starts to be [a bit involved](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/test/java/com/template/car/flow/CarTokenCourseHelpers.java#L15-L28), given all the CorDapps you need to include, along with the preferred notary:

```java
return new MockNetworkParameters()
        .withNotarySpecs(Collections.singletonList(new MockNetworkNotarySpec(CarTokenTypeConstants.NOTARY)))
        .withCordappsForAllNodes(ImmutableList.of(
                TestCordapp.findCordapp("com.r3.corda.lib.accounts.contracts"),
                TestCordapp.findCordapp("com.r3.corda.lib.accounts.workflows"),
                TestCordapp.findCordapp("com.r3.corda.lib.tokens.contracts"),
                TestCordapp.findCordapp("com.r3.corda.lib.tokens.workflows"),
                TestCordapp.findCordapp("com.r3.corda.lib.tokens.money"),
                TestCordapp.findCordapp("com.r3.corda.lib.tokens.selection"),
                TestCordapp.findCordapp("com.r3.corda.lib.ci.workflows"),
                TestCordapp.findCordapp("com.template.car.state"),
                TestCordapp.findCordapp("com.template.car.flow")))
        .withNetworkParameters(ParametersUtilitiesKt.testNetworkParameters(
                Collections.emptyList(), 4
        ));
```
Plus, the [specific nodes](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/test/java/com/template/car/flow/AtomicSaleAccountsSafeTests.java#L58-L67):

```java
network = new MockNetwork(prepareMockNetworkParameters());
notary = network.getDefaultNotaryNode();
dmv = network.createNode(new MockNodeParameters()
        .withLegalName(CarTokenTypeConstants.DMV));
bmwDealer = network.createNode(new MockNodeParameters()
        .withLegalName(CarTokenTypeConstants.BMW_DEALER));
alice = network.createNode();
bob = network.createNode();
```

### Passing public keys around

Since you want to make your flows account-safe only, you do not expect them to request keys around. Instead, you need to prepopulate them with the keys that will be used when calling the flows. That is the purpose of this [`inform`](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/test/java/com/template/account/AccountTokenCourseExercise.java#L87) function that uses `SyncKeyMappingInitiator`:

```java
private void inform(
        @NotNull final StartedMockNode host,
        @NotNull final PublicKey who,
        @NotNull final List<StartedMockNode> others) throws Exception {
    final AccountService accountService = host.getServices()
            .cordaService(KeyManagementBackedAccountService.class);
    final StateAndRef<AccountInfo> accountInfo = accountService.accountInfo(who);
    if (!host.getInfo().getLegalIdentities().get(0).equals(accountInfo.getState().getData().getHost())) {
        throw new IllegalArgumentException("hosts do not match");
    }
    for (StartedMockNode other : others) {
        final CordaFuture future = host.startFlow(new SyncKeyMappingInitiator(
                other.getInfo().getLegalIdentities().get(0),
                Collections.singletonList(new AnonymousParty(who))));
        network.runNetwork();
        future.get();
    }
}
```

### Testing with account keys

Now it is time to look at the unit tests that confirm our flows are safe:

* Confirm that the node needs to know about keys beforehand: [`accountNeedsToBeKnownToHoldCar`](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/test/java/com/template/account/AccountTokenCourseExercise.java#L147).
* Confirm that the node can issue a car to an anonymous holder: [`accountDanCanHoldCar`](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/test/java/com/template/account/AccountTokenCourseExercise.java#L163).
* Confirm that the node can move a car from one anonymous holder to another: [`accountDanCanGiveCarAwayToEmma`](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/test/java/com/template/account/AccountTokenCourseExercise.java#L180).

## Fix the `AtomicSale`

The previous atomic sale _example_ suffers from 2 problems:

1. The buyer automatically accepts the sales without checking whether this is desirable. You will fix this in a later chapter.
2. The flow is not account-safe.

The example has 2 versions of the atomic sale flow pair where point 2 has been fixed:

* An account-safe version of the flows.
* An account-aware version of the flows.

In fact, there is an `abstract` account-safe version of the flows that is sub-flowed by 2 further implementations.

## [`AtomicSaleAccountsSafe`](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/main/java/com/template/car/flow/AtomicSaleAccountsSafe.java)

This file contains 4 flows:

1. Inlined `abstract class CarSellerFlow extends FlowLogic<SignedTransaction>`.
2. Inlined `abstract class CarBuyerFlow extends FlowLogic<SignedTransaction>`, which is the handler of the above.
3. Initiating `class CarSeller extends FlowLogic<SignedTransaction>`, which sub-flows `CarSellerFlow`.
4. `class CarBuyer extends FlowLogic<SignedTransaction>`, which is initiated by `CarSeller`, and which sub-flows `AtomicSaleAccountsSafe.CarBuyerFlow`..

The naming convention of initiating `CarSeller`&nbsp;/ inlined `CarSellerFlow` is commonly found in Corda.

### `CarSellerFlow` and `CarBuyerFlow`

Let's go through these flows':

* Attributes.
* Abstract functions.
* Action steps when they differ from the original unsafe `AtomicSale`.

#### Attributes

[`CarSellerFlow`](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/main/java/com/template/car/flow/AtomicSaleAccountsSafe.java#L98) takes in:

```java
@NotNull
private final TokenPointer<CarTokenType> car;
@NotNull
private final FlowSession buyerSession;
@NotNull
private final IssuedTokenType issuedCurrency;
```
Notice that it does **not** take the identity of the buyer. This is so in order to be flexible with regard to accounts, or not.

[`CarBuyerFlow`](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/main/java/com/template/car/flow/AtomicSaleAccountsSafe.java#L265) takes in the classic:

```java
@NotNull
private final FlowSession sellerSession;
```

#### Abstract functions

So, how does the seller flow identify the future holder of the car token? It has to be an `AbstractParty`. So it needs both the seller and the buyer to agree on it. That's the role of the first abstract functions:

* On the seller's side:

    ```java
    @NotNull
    abstract protected FlowLogic<AbstractParty> getSyncBuyerPartyFlow();
    ```
* On the buyer's side:

    ```java
    @NotNull
    abstract protected FlowLogic<AbstractParty> getSyncBuyerPartyHandlerFlow();
    ```

Do you notice the naming symmetry? It hints at the fact that these 2 functions should return inlined flows that are compatible with each. For instance:

* A `.send` here and a `.receive` there.
* Or a `RequestKeyFlow` here and a `ProvideKeyFlow` there.

As you will see, this is exactly what the initiating flows do. For the avoidance of doubt, both functions return an instance of a flow, ready to be used in a `subFlow` command. Also, both of the flow instances return an `AbstractParty`, which has to be identical or the flow will fail.

The other abstract function is on the buyer side only:

```java
@NotNull
abstract protected QueryCriteria getHeldByBuyer(
        @NotNull final IssuedTokenType issuedCurrency,
        @NotNull final AbstractParty buyer) throws FlowException;
```
To be able to search by account, or not.

#### Action!

The first thing the flow does is agree on both sides about who the buyer is:

```java
final AbstractParty buyer = subFlow(getSyncBuyerPartyFlow());
// and
final AbstractParty buyer = subFlow(getSyncBuyerPartyHandlerFlow());
```
It continues, similarly, to what you have already seen in `AtomicSale`, also fetching the seller, note it is not `getOurIdentity()`:

```java
final AbstractParty seller = heldCarTokens.get(0).getState().getData().getHolder();
```
The buyer side collects fungible input tokens that belong to the buyer:

```java
//                                The abstract function
final QueryCriteria heldByBuyer = getHeldByBuyer(issuedCurrency, buyer);
...
```
This means the _dollar states_ may come from more than 1 holder public key, but they would all belong to the buyer in any case. The buyer side is also careful about giving the new tokens to the seller, and not the counterparty node, and the change to the agreed buyer:

```java
[...] tokenSelection.generateMove(
        Collections.singletonList(new Pair<>(
                heldCarToken.getState().getData().getHolder(), priceInCurrency)),
        buyer,
        [...]
```
Then, when the seller's host receives the fungible input tokens, it verifies that it is not being swindled:

```java
.filter(it -> it.getState().getData().getHolder().equals(seller))
```
Also, because it received _dollar states_ from potentially unknown accounts:

```java
final List<AbstractParty> missingKeys = currencyInputs.stream()
        .map(it -> it.getState().getData().getHolder())
        .filter(it -> getServiceHub().getIdentityService()
                .wellKnownPartyFromAnonymous(it) == null)
        .collect(Collectors.toList());
```
The seller's host needs to ask the buyer's host to resolve them, by asking for the minimum necessary to proceed:

```java
buyerSession.send(missingKeys);
subFlow(new SyncKeyMappingFlowHandler(buyerSession));
```
Back on the buyer's host, it trusts but verifies, first by collecting the keys that **might** be missing from the seller:

```java
final Set<AbstractParty> potentiallyMissingKeys = inputsAndOutputs.getFirst().stream()
        .map(it -> it.getState().getData().getHolder())
        .collect(Collectors.toSet());
```
Then, again thinking adversarially, confirms that the seller is not trying to learn about more keys than necessary:

```java
final List<AbstractParty> missingKeys = (List<AbstractParty>) sellerSession
        .receive(List.class).unwrap(it -> it);
if (!potentiallyMissingKeys.containsAll(missingKeys))
    throw new FlowException("A missing key is not in the potentially missing keys");
```

And finally obliges:
```java
subFlow(new SyncKeyMappingFlow(sellerSession, missingKeys));
```
After that, the buyer's host continues verification of the output states, then signs the transaction:

```java
final SignedTransaction partSignedTx = getServiceHub().signInitialTransaction(txBuilder,
        seller.getOwningKey());
     // ^ Yes, the seller
```
Then asks the buyer's side for the same:

```java
final SignedTransaction fullySignedTx = subFlow(new CollectSignaturesFlow(partSignedTx,
        Collections.singletonList(buyerSession),
        Collections.singleton(seller.getOwningKey())));
```
If it had not resolved the missing keys, `CollectSignaturesFlow` would have failed because it would not have been able to resolve which node hosts the missing keys. Meanwhile, on the buyer's node, it obliges:

```java
final SecureHash signedTxId = subFlow(new SignTransactionFlow(sellerSession) [...]
```
The buyer's node does the same checks as in the old `AtomicSale` and of course, checks that the car will belong to the new owner:

```java
if (!outputHeldCar.getHolder().equals(buyer))
    throw new FlowException("The car is not held by the buyer in output");
```
Then, finalisation happens uneventfully.

Your 3 main take aways are that:

1. `getOurIdentity()` was never called as both hosts only cared about ensuring the stated seller and buyer are used.
2. The _dollar states_ have to be taken broadly because the buyer may have enough fungible tokens to pay but they may be scattered across various public keys.
3. Missing keys needed to be resolved.

### `CarSeller` and `CarBuyer`

As mentioned earlier, these 2 flows use the 2 flows you walked through above. How do they achieve that?

* They have relevant attributes.
* They do some preparation.
* They sub-flow and override the abstract functions.

#### [`CarSeller`](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/main/java/com/template/car/flow/AtomicSaleAccountsSafe.java#L46)

The `CarSeller` predictably needs:

```java
@NotNull
private final TokenPointer<CarTokenType> car;
@NotNull
private final AbstractParty buyer;
@NotNull
private final IssuedTokenType issuedCurrency;
```
Compared to the old `AtomicSale`, the `buyer` is now an `AbstractParty`. Remember, these 2 flows are still account-safe, not account-aware. Alone, `buyer` does not inform about where the `buyer` is hosted. It has to get that from its vault:

```java
final Party buyerHost = getServiceHub().getIdentityService()
        .requireWellKnownPartyFromAnonymous(buyer);
```
Observe that it is `.requireWell...`. This means that if the `buyer` cannot be resolved, it will fail there and then. This flow assumes that the relevant buyer information has already been populated into the vault.

From there, it is only a matter of calling `subFlow` on the inlined flow, with an override:

```java
return subFlow(new CarSellerFlow(car, buyerSession, issuedCurrency) {
    @NotNull
    @Override
    protected FlowLogic<AbstractParty> getSyncBuyerPartyFlow() {
        return new FlowLogic<AbstractParty>() {
            @Suspendable
            @NotNull
            @Override
            public AbstractParty call() {
                buyerSession.send(buyer);
                return buyer;
            }
        };
    }
});
```
Exactly. This special flow only sends the `buyer`. After all, it is already known... This hints at what `getSyncBuyerPartyHandlerFlow` needs to return on the buyer's host.

#### [`CarBuyer`](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/main/java/com/template/car/flow/AtomicSaleAccountsSafe.java#L226)

As it always is with an `@InitiatedBy` flow, it only keeps a:

```java
@NotNull
private final FlowSession sellerSession;
```
It then dives straight into `subFlow`:

```java
return subFlow(new CarBuyerFlow(sellerSession) {
    @NotNull
    @Override
    protected FlowLogic<AbstractParty> getSyncBuyerPartyHandlerFlow() {
        return new FlowLogic<AbstractParty>() {
            @Suspendable
            @NotNull
            @Override
            public AbstractParty call() throws FlowException {
                return sellerSession.receive(AbstractParty.class).unwrap(it -> it);
            }
        };
    }
    [...]
```
Where indeed, it `.receive`s the buyer information, given it was `.send` from the seller's host. Don't forget that it has to override the query criteria function too:

```java
    [...]
        @NotNull
        @Override
        protected QueryCriteria getHeldByBuyer(
                @NotNull IssuedTokenType issuedCurrency,
                @NotNull final AbstractParty buyer) {
            return QueryUtilitiesKt.heldTokenAmountCriteria(
                    issuedCurrency.getTokenType(), buyer);
        }
    });
}
```
This query formula is taken from the old `AtomicSale` where `getOurIdentity()` is replaced with `buyer`.

#### Tests

The tests confirm that:

* It works with well-known parties, see [`partiesCanDoAtomicSaleAccountsSafe`](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/test/java/com/template/car/flow/AtomicSaleAccountsSafeTests.java#L147).
*  It works with account keys as well, see [`accountsCanDoAtomicSaleAccountsSafe`](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/test/java/com/template/car/flow/AtomicSaleAccountsSafeTests.java#L201). Notice how:
    * the dealer is [informed about Dan the car holder](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/test/java/com/template/car/flow/AtomicSaleAccountsSafeTests.java#L208) beforehand:

    ```java
    inform(alice, danParty.getOwningKey(), Collections.singletonList(bmwDealer));
    ```
    * the seller's host and the mint are [informed about Emma the buyer](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/test/java/com/template/car/flow/AtomicSaleAccountsSafeTests.java#L215) beforehand:

    ```java
    inform(bob, emmaParty.getOwningKey(), Arrays.asList(alice, usMint));
    ```
    The mint needs to know too in order to send the minted dollars to the buyer's host.

This concludes the review of an account-safe atomic sale. To recap:

* The buyer is resolved, and it's host identified.
* Information is exchanged.
* Missing keys are resolved.

Time to move to the account-aware atomic sale.

## [`AtomicSaleAccounts`](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/main/java/com/template/car/flow/AtomicSaleAccounts.java)

This file contains 2 flows:

1. Initiating `class CarSeller extends FlowLogic<SignedTransaction>`, which sub-flows `AtomicSaleAccountsSafe.CarSellerFlow`.
2. `class CarBuyer extends FlowLogic<SignedTransaction>`, which is initiated by `CarSeller` and which sub-flows `AtomicSaleAccountsSafe.CarBuyerFlow`.

Let's review them.

### `CarSeller` and `CarBuyer`

They are not extraordinary:

* They have relevant attributes.
* They do some preparation.
* They sub-flow and override the abstract functions.

#### [`CarSeller`](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/main/java/com/template/car/flow/AtomicSaleAccounts.java#L31)

It is meant to be account-aware, which explains why it takes a `UUID` in its attributes:

```java
@NotNull
private final TokenPointer<CarTokenType> car;
@NotNull
private final UUID buyer;
@NotNull
private final IssuedTokenType issuedCurrency;
```
On its own, it does not reveal much. That's why it resolves it with:

```java
final AccountService accountService = UtilitiesKt.getAccountService(this);
final StateAndRef<AccountInfo> buyerAccount = accountService.accountInfo(buyer);
if (buyerAccount == null)
        throw new FlowException("This buyer account is unknown: " + buyer);
```
Here again, the account information needs to have been informed to the seller's host prior to launching this flow. The flow can now inform the buyer's side about which account this is for. It is important for the buyer's side to know which account is the buyer so that it can create the proper public key, and collect the proper _dollar states_:

```java
buyerSession.send(buyer);
```
Boom. With this done, it dives straight into sub-flow with the account-safe inlined flow:

```java
return subFlow(new AtomicSaleAccountsSafe.CarSellerFlow(car, buyerSession, issuedCurrency) {
    @NotNull
    @Override
    protected FlowLogic<AbstractParty> getSyncBuyerPartyFlow() {
        return new FlowLogic<AbstractParty>() {
            @NotNull
            @Suspendable
            @Override
            public AbstractParty call() throws FlowException {
                return subFlow(new RequestKeyFlow(
                        buyerSession, buyerAccount.getState().getData().getLinearId().getId()));
            }
        };
    }
});
```
Why the choice of `RequestKeyFlow` instead of the more account-idiomatic `RequestKeyForAccountFlow`? That's because, at the current version, the handler `SendKeyForAccountFlow` does not return the created key but `Unit` (a.k.a. `void`) instead. And we need the buyer's host to be precisely informed about which account will receive the car, so that it can be checked.

Why not just `return new RequestKeyFlow([...]`? Unfortunately, `RequestKeyFlow` extends `FlowLogic<AnonymousParty>` and we would have to change our return type to `FlowLogic<? extends AbstractParty>` for compilation to pass. A minor inconvenience, really.

This `RequestKeyFlow` hints at what `getSyncBuyerPartyHandlerFlow` needs to return.

#### [`CarBuyer`](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/main/java/com/template/car/flow/AtomicSaleAccounts.java#L94)

Again, because it is `@InitiatedBy`, it has only:

```java
@NotNull
private final FlowSession sellerSession;
```
You saw in the seller's side that it sends the buyer id, so to follow the choreography:

```java
final UUID buyer = sellerSession.receive(UUID.class).unwrap(it -> it);
```
Does its own checks, including that it is the buyer's host:

```java
if (!buyerAccount.getState().getData().getHost().equals(getOurIdentity()))
    throw new FlowException("We are not this account's host");
```
With this done, it can call the account-safe sub-flow:

```java
return subFlow(new AtomicSaleAccountsSafe.CarBuyerFlow(sellerSession) {
    @NotNull
    @Override
    protected FlowLogic<AbstractParty> getSyncBuyerPartyHandlerFlow() {
        return new FlowLogic<AbstractParty>() {
            @Suspendable
            @NotNull
            @Override
            public AbstractParty call() throws FlowException {
                return subFlow(new ProvideKeyFlow(sellerSession));
            }
        };
    }
    [...]
```
Using `ProvideKeyFlow` as expected, and overriding the query criteria to use the one you saw in the accounts chapter:

```java
    [...]
    @NotNull
    @Override
    protected QueryCriteria getHeldByBuyer(
            @NotNull IssuedTokenType issuedCurrency,
            @NotNull final AbstractParty buyerParty) {
        return new QueryCriteria.VaultQueryCriteria()
                .withExternalIds(Collections.singletonList(buyer));
    }
});
```

#### Tests

The only test confirms that it works with accounts, see [`accountsCanDoAtomicSaleAccounts`](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/test/java/com/template/car/flow/AtomicSaleAccountsTests.java#L162). Notice how:

* The dealer is [informed about Dan the car holder](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/test/java/com/template/car/flow/AtomicSaleAccountsTests.java#L169), beforehand, but only about the public key:

  ```java
  informKeys(alice,
          Collections.singletonList(danParty.getOwningKey()),
          Collections.singletonList(bmwDealer));
  ```
* Emma, the buyer, has 2 tokens:
    * These tokens cover the price of the car only together (2 * 15,000 > 25,000):

    ```java
    final Amount<IssuedTokenType> amountOfUsd = AmountUtilitiesKt
            .amount(15_000L, usMintUsd);
    ```
    * Each token is held by a different public key:

    ```java
    final FungibleToken usdTokenEmma1 = new FungibleToken(
            amountOfUsd, emmaParty1, null);
    final FungibleToken usdTokenEmma2 = new FungibleToken(
            amountOfUsd, emmaParty2, null);
    final IssueTokens flow = new IssueTokens(
            Arrays.asList(usdTokenBob, usdTokenEmma1, usdTokenEmma2),
            Collections.emptyList());
    ```
* The mint is [informed about Emma the buyer](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/test/java/com/template/car/flow/AtomicSaleAccountsSafeTests.java#L215), but only on her **public keys**, beforehand:

  ```java
  informKeys(bob,
          Arrays.asList(emmaParty1.getOwningKey(), emmaParty2.getOwningKey()),
          Collections.singletonList(usMint));
  ```
  The mint needs to know too so it can send the minted dollars to the buyer's host.
* The seller is [informed about Emma the buyer](https://github.com/corda/corda-training-code/blob/master/040-accounts-lib/workflows/src/test/java/com/template/car/flow/AtomicSaleAccountsTests.java#L183), but only about **her account**:

  ```java
  informAccounts(bob, Collections.singletonList(emma),
          Collections.singletonList(alice));
  ```

The assertions verify that:

* The newly created key for Emma holds the car and the dollar change.
* Dan holds 25,000 of the dollars:

    ```java
    assertEquals(AmountUtilitiesKt.amount(25_000L, usdTokenType).getQuantity(),
            paidToDan);
    ```

You could decide to have Dan create a new public key to hold the dollar states. This is left for you as an exercise.

This concludes the review of an account-aware atomic sale. To recap:

* The buyer id is resolved, and it's host identified.
* The buyer keys are resolved.
* Information is exchanged.
* Missing keys are resolved too.
