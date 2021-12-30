---
title: Make a car sale
description: Create a flow to sell a car
slug: create-car-sale
menu:
  main:
    parent: token-sdk
    weight: 60  
weight: 60
---

{{<ExpansionPanel title="Code">}}

You may start this exercise by working from: https://github.com/corda/corda-training-code/tree/master/020-first-token

{{</ExpansionPanel>}}

In the previous chapter, you created your car token and implemented simple flows related to it. Here, you will consider what selling a car means in this context.

## Sale and atomicity

In the previous exercise you relied on the basic flows of the Tokens SDK. Each time, you were served a fully formed transaction and were not given the opportunity to amend it before signature. In particular, in a few lines of code, Alice **gave** the car **away** to Bob. She did not **sell** it. For the transaction to be a sale, something would have to move "the other way". Preferably atomically, meaning either everything passes, or nothing passes. For example, if Alice was selling her car to Bob; the transaction could have 2 types of tokens moving:

1. Bob moving USD tokens to Alice.
2. Alice moving the car token to Bob.

You want both of these moves to happen successfully or fail the transaction entirely. Consider a non-atomic workflow, which is what happens if we are not careful and use those ready flows that are provided by the SDK.

## A non-atomic sale

{{<HighlightBox type="warn">}}

Don't do that, this is only for your own edification.

{{</HighlightBox>}}

Observe an untested example flow [here](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/car/flow/bad/NonAtomicSale.java).

1. The Initiator / seller proposes selling:

    ```java
    @NotNull private final TokenPointer<CarTokenType> car;
    ```
    for the price saved in the CarTokenType, in this currency:

    ```java
    @NotNull private final IssuedTokenType issuedCurrency;
    ```
    to this buyer:

    ```java
    @NotNull private final Party buyer;
    ```
2. Let's go through the motions on the seller's side first:

    ```java
    // Recall the price.
    final StateAndRef<CarTokenType> carInfo = car.getPointer().resolve(getServiceHub());
    final long price = carInfo.getState().getData().getPrice();

    // Create a session with the buyer.
    final FlowSession buyerSession = initiateFlow(buyer);

    // Send the car price.
    buyerSession.send(price);

    // Send the currency desired.
    buyerSession.send(issuedCurrency);

    // For simplicity we assume that the seller sends back the transaction that paid the seller.
    // Receive the payment tx. ReceiveTransactionFlow is the responder flow of a specialized DataVendingFlow
    // that sends a transaction and its history.
    final SignedTransaction payTx = subFlow(new ReceiveTransactionFlow(buyerSession));
    // TODO check we were paid indeed.
    // Shall we continue or do we disappear with the money?

    // An exception could also happen here leaving the buyer without their money or car.

    // Move the car to the buyer.
    final PartyAndToken carForBuyer = new PartyAndToken(buyer, car);
    final QueryCriteria myCarCriteria = QueryUtilitiesKt.heldTokenAmountCriteria(
            car, getOurIdentity());
    return subFlow(new MoveNonFungibleTokens(carForBuyer, Collections.emptyList(), myCarCriteria));
    ```
3. From the buyer's side, which has a `FlowSession sellerSession`:

    ```java
    // Receive the car price.
    final long price = sellerSession.receive(Long.class).unwrap(it -> it);

    // Receive the currency information.
    final IssuedTokenType issuedCurrency = sellerSession.receive(IssuedTokenType.class).unwrap(it -> it);

    // Pay seller.
    final QueryCriteria heldByMe = QueryUtilitiesKt.heldTokenAmountCriteria(
            issuedCurrency.getTokenType(), getOurIdentity());
    final QueryCriteria properlyIssued = QueryUtilitiesKt.tokenAmountWithIssuerCriteria(
            issuedCurrency.getTokenType(), issuedCurrency.getIssuer());
    final Amount<TokenType> currencyPrice = AmountUtilitiesKt.amount(price, issuedCurrency.getTokenType());
    final PartyAndAmount<TokenType> amountForSeller = new PartyAndAmount<>(sellerSession.getCounterparty(), currencyPrice);
    final SignedTransaction payTx = subFlow(new MoveFungibleTokens(
            Collections.singletonList(amountForSeller),
            Collections.singletonList(sellerSession.getCounterparty()),
            properlyIssued.and(heldByMe),
            getOurIdentity()));

    // Inform seller. SendTransactionFlow is a specialized DataVendingFlow that sends a transaction and
    // its history.
    subFlow(new SendTransactionFlow(sellerSession, payTx));

    //Receiving the car is taken care of by the auto-responder of MoveNonFungibleTokens.
    return null;
    ```

In this example of a non-atomic sale (bad!), it is very possible that an exception could happen inside the initiator right after the buyer flow completed successfully, i.e. after the buyer has moved their money to the seller. Not to mention that the buyer could be malicious and disappear, mid-flow _with the money_.

{{<HighlightBox type="warn">}}

Remember not to use the code above that is presented as an example of what _not_ to do.

{{</HighlightBox>}}

## An atomic sale

Hello? [IAEA](https://www.iaea.org/)? No, not _that_ kind of atomic sale.

Due to the shortcomings of a non-atomic sale, and the fact that the high-level flows are not extensible, in cases like this we have to use the utility functions that are provided by the Tokens SDK, in order to assemble a single transaction that contains both sides of the trade.

You can dig on your own inside the high-level flows of the SDK to find out things like:

* There is a function named [`addMoveFungibleTokens `](https://github.com/corda/token-sdk/blob/b9a1ee76434defd0b234df05c972202c7f1a2a5c/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/move/MoveFungibleTokensFlow.kt#L46)
* which itself calls [`generateMove`](https://github.com/corda/token-sdk/blob/b9a1ee76434defd0b234df05c972202c7f1a2a5c/modules/selection/src/main/kotlin/com.r3.corda.lib.tokens.selection/api/Selector.kt#L106) that assembles inputs and outputs for your convenience. You might sense that it will be advantageous to use it on the buyer's side, when assembling the _dollar states_ for payment.
* There is a flow named [`SendStateAndRefFlow`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/flows/SendTransactionFlow.kt#L81) that allows a party to send a list of `StateAndRef<T>` to any peer, including the historical chain of transactions that _prove_ their validity. You might sense that it will be useful for the seller to send information about the car being sold, and the buyer to send information about those _dollar states_.

What are the things that such an atomic sale flow has to resolve?

* One party, the initiator, has to create the transaction, while the other party, the responder, verifies and signs it. Whether the initiator is the seller or the buyer, or either, has to be decided at some point. If may be useful to think of a signed offer that is open to acceptance, and acceptance that finalizes the sale.
* The seller has to provide the car's `StateAndRef<NonFungibleToken>`.
* The buyer has to verify that the provided `NonFungibleToken` indeed describes the desired car. Otherwise the seller could bait and switch and pass something else entirely.
* The buyer has to provide a list of `StateAndRef<FungibleToken>` to cover the price in the agreed issued currency.
* The seller has to verify that the provided `FungibleToken`s are of the right type and amount to cover the price. Because trust but verify...
* The responder has to verify that the transaction that it is asked to sign is indeed the transaction that is expected with the states that were mentioned earlier. Otherwise the initiator could bait and switch too, by asking for states information and asking to sign a different transaction.

This is information enough for you to try your hand at creating an atomic sale. Go!

In the next chapter, you will discover an example solution of an atomic sale.

### A word on data vending

This is a fancy word for the act of exchanging data between peers. Why not just say `.send` and `.receive`? Sure, for regular types, send and receive is enough. So we use data vending to describe a complex send where more data has to be fetched.

You have seen an example in the non-atomic sale above. You used [`SendTransactionFlow`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/flows/SendTransactionFlow.kt#L70), which sends the whole chain of transactions that led to the one you want to send. Or rather it sends those that the recipient [does not have yet](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/flows/SendTransactionFlow.kt#L127). Same with [`SendStateAndRef`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/flows/SendTransactionFlow.kt#L81), for a list of `StateAndRef`s. Don't hesitate to use them.
