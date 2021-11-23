---
title: Car Sale Solution
description: An example car sale solution using the Tokens SDK
slug: car-sale-solution
menu:
  main:
    parent: libraries
    weight: 80  
weight: 80
---


In the previous chapter, you were asked to try your hand at creating a flow that creates an atomic sale transaction, using lower-level Tokens functions. Here you will compare your work to an example solution. For the best absorption of knowledge, peek at this answer only after having tried on your own.

Some important decisions were made:

* The seller initiates, and collects all states.
* The seller creates the transaction and signs it first.
* The buyer verifies then signs the transaction after.

The code can be found [here](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/main/java/com/template/car/flow/AtomicSale.java), and tests [here](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/car/flow/AtomicSaleTests.java).

## Walkthrough

Examine the steps of this flow:

* The seller is the initiator:

    ```java
    @InitiatingFlow
    class CarSeller extends FlowLogic<SignedTransaction> {
    ```
* The seller flow requires the minimum fields to proceed:

    ```java
    @NotNull
    private final TokenPointer<CarTokenType> car;
    @NotNull
    private final Party buyer;
    @NotNull
    private final IssuedTokenType issuedCurrency;
    ```
* The seller starts by retrieving the latest state of the car:

    ```java
    final StateAndRef<CarTokenType> carInfo = car.getPointer().resolve(getServiceHub());
    ```
* The seller immediately sends that to the buyer, so that it can spawn:

    ```java
    final FlowSession buyerSession = initiateFlow(buyer);
    subFlow(new SendStateAndRefFlow(buyerSession, Collections.singletonList(carInfo)));
    ```
    Despite its name, this step is more involved than a simple non-blocking `.send`.
* The seller continues assembling information, the price they will expect:

    ```java
    final long price = carInfo.getState().getData().getPrice();
    ```
    The buyer will be able to do the same on their side since they received the `carInfo`. There is no need to send the price on its own.
* And a proof that the seller owns the car:

    ```java
    final QueryCriteria tokenCriteria = heldTokenCriteria(car);
    final List<StateAndRef<NonFungibleToken>> heldCarTokens = getServiceHub().getVaultService()
            .queryBy(NonFungibleToken.class, tokenCriteria).getStates();
    if (heldCarTokens.size() != 1) throw new FlowException("NonFungibleToken not found");
    ```
* The seller wastes no time sending the proof to the buyer:

    ```java
    subFlow(new SendStateAndRefFlow(buyerSession, heldCarTokens));
    ```
* And the currency in which they expect to be paid:

    ```java
    buyerSession.send(issuedCurrency);
    ```
    Until this point, the seller has sent all the information that the buyer needs. The seller, can nonetheless keep working while, presumably, the buyer is preparing itself to send the _dollar states_.
* The seller prepares the basics of the future transaction:

    ```java
    final Party notary = carInfo.getState().getNotary();
    final TransactionBuilder txBuilder = new TransactionBuilder(notary);
    ```
    {{<HighlightBox type="info">}}

    There needs to be a single notary for the whole transaction. This means that the car info, the NFT and the _dollar states_ need to all be referencing the same notary. If there is a discrepancy, then some states have to change their notary. But neither the seller nor the buyer can change the notary on the `carInfo`, so we pick its notary. Later, you will learn how to change the notary on states.

    {{</HighlightBox>}}
* The seller continues by adding the car info to the transaction, using the lower-level [`addMoveNonFungibleTokens`](https://github.com/corda/token-sdk/blob/b9a1ee76434defd0b234df05c972202c7f1a2a5c/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/move/MoveTokensUtilities.kt#L158):

    ```java
    final PartyAndToken carForBuyer = new PartyAndToken(buyer, car);
    MoveTokensUtilitiesKt.addMoveNonFungibleTokens(txBuilder, getServiceHub(), carForBuyer, null);
    ```
* At this point the seller, has nothing else to do but wait for the _dollar states_ from the buyer:

    ```java
    final List<StateAndRef<FungibleToken>> currencyInputs = subFlow(new ReceiveStateAndRefFlow<>(buyerSession));
    ```
* Switching to the buyer, examine what it did during this time. As expected, following the choreography, it starts by receiving the car info:

    ```java
    final List<StateAndRef<CarTokenType>> carInfos = subFlow(new ReceiveStateAndRefFlow<>(sellerSession));
    if (carInfos.size() != 1) throw new FlowException("We expected a single car type");
    final StateAndRef<CarTokenType> carInfo = carInfos.get(0);
    final long price = carInfo.getState().getData().getPrice();
    ```
    Note that, like the seller, the buyer takes the price from the car info.
* The buyer then receives the proof of ownership of the car:

    ```java
    final List<StateAndRef<NonFungibleToken>> heldCarTokens = subFlow(new ReceiveStateAndRefFlow<>(sellerSession));
    if (heldCarTokens.size() != 1) throw new FlowException("We expected a single held car");
    final StateAndRef<NonFungibleToken> heldCarToken = heldCarTokens.get(0);
    ```
* The buyer can already check whether the 2 pieces of information match, is it the same car:

    ```java
    if (!((TokenPointer<CarTokenType>) heldCarToken.getState().getData().getTokenType())
            .getPointer().getPointer()
            .equals(carInfo.getState().getData().getLinearId()))
        throw new FlowException("The owned car does not correspond to the earlier car info.");
    ```
* But is it really the car that the buyer wants to buy? Here, there is a missing piece of the puzzle. You cannot fix this in an automatic way just yet, but you will address it in a later chapter.

    ```java
    // TODO have an internal check that this is indeed the car we intend to buy.
    ```
* Continue with the choreography, and have the buyer receive the desired currency:

    ```java
    final IssuedTokenType issuedCurrency = sellerSession.receive(IssuedTokenType.class).unwrap(it -> it);
    ```
* But is it really the currency they agreed to buy it with? Same here. You address it later:

    ```java
    // TODO have an internal check that this is indeed the currency we decided to use in the sale.
    ```
* Now that the buyer has enough information to collect the _dollar states_:

    ```java
    final QueryCriteria heldByMe = QueryUtilitiesKt.heldTokenAmountCriteria(
            issuedCurrency.getTokenType(), getOurIdentity());
    final QueryCriteria properlyIssued = QueryUtilitiesKt.tokenAmountWithIssuerCriteria(
            issuedCurrency.getTokenType(), issuedCurrency.getIssuer());
    final Amount<TokenType> priceInCurrency = AmountUtilitiesKt.amount(price, issuedCurrency.getTokenType());
    final DatabaseTokenSelection tokenSelection = new DatabaseTokenSelection(
            getServiceHub(), MAX_RETRIES_DEFAULT, RETRY_SLEEP_DEFAULT, RETRY_CAP_DEFAULT, PAGE_SIZE_DEFAULT);
    final Pair<List<StateAndRef<FungibleToken>>, List<FungibleToken>> inputsAndOutputs = tokenSelection.generateMove(
            Collections.singletonList(new Pair<>(sellerSession.getCounterparty(), priceInCurrency)),
            getOurIdentity(),
            new TokenQueryBy(issuedCurrency.getIssuer(), it -> true, heldByMe.and(properlyIssued)),
            getRunId().getUuid());
    ```
    Note the result:

    1. A `List<StateAndRef<FungibleToken>>` for the inputs.
    2. A `List<FungibleToken>` for the outputs.

    By an amazing turn of events, the first list is exactly what the seller has been waiting for since attention turned to the buyer.
* So have the buyer send the input states:

    ```java
    subFlow(new SendStateAndRefFlow(sellerSession, inputsAndOutputs.getFirst()));
    ```
* And while you are at it, send the output states too:

    ```java
    sellerSession.send(inputsAndOutputs.getSecond());
    ```
    Here, it sends the `FungibleToken`s unceremoniously because they are not part of a historical chain. They are just proposed outputs.
* At this stage, the buyer has nothing to do but wait for the proposed transaction to come back for signature:

    ```java
    final SecureHash signedTxId = subFlow(new SignTransactionFlow(sellerSession) {
        ...
    ```
* So let's turn back to the seller, which, as previously seen, collected the fungible inputs:

    ```java
    final List<StateAndRef<FungibleToken>> currencyInputs = subFlow(new ReceiveStateAndRefFlow<>(buyerSession));
    ```
* But are they legitimate? Perhaps the buyer is sending to the seller a list of the seller's own fungible states. Let's make sure:

    ```java
    final long ourCurrencyInputCount = currencyInputs.stream()
            .filter(it -> it.getState().getData().getHolder().equals(getOurIdentity()))
            .count();
    if (ourCurrencyInputCount != 0)
        throw new FlowException("The buyer sent us some of our token states: " + ourCurrencyInputCount);
    ```
    Other than that, errors, like passing a third-party's fungible tokens will be caught by the contract because the buyer is in control of the commands' signers.
* To follow along the choreography, the seller also needs to receive the fungible outputs:

    ```java
    final List<FungibleToken> currencyOutputs = buyerSession.receive(List.class).unwrap(it -> it);
    ```
* But are these legitimate, are the _dollars_ for the seller? Who knows, the buyer is perhaps sending new states that are held by the buyer themselves. That would be like having the cake and eating it, too. And, are they of the desired currency:

    ```java
    final long sumPaid = currencyOutputs.stream()
            .filter(it -> it.getHolder().equals(getOurIdentity()))
            .map(FungibleToken::getAmount)
            .filter(it -> it.getToken().equals(issuedCurrency))
            .map(Amount::getQuantity)
            .reduce(0L, Math::addExact);
    if (sumPaid < AmountUtilitiesKt.amount(price, issuedCurrency.getTokenType()).getQuantity())
        throw new FlowException("We were paid only " +
                sumPaid / AmountUtilitiesKt.amount(1L, issuedCurrency.getTokenType()).getQuantity() +
                " instead of the expected " + price);
    ```
* With all required information, the seller can further add to the transaction:

    ```java
    MoveTokensUtilitiesKt.addMoveTokens(txBuilder, currencyInputs, currencyOutputs);
    ```
* The seller then signs:

    ```java
    final SignedTransaction partSignedTx = getServiceHub().signInitialTransaction(txBuilder,
            getOurIdentity().getOwningKey());
    ```
* And expects the same from the buyer:

    ```java
    final SignedTransaction fullySignedTx = subFlow(new CollectSignaturesFlow(partSignedTx,
            Collections.singletonList(buyerSession)));
    ```
    With this blocking step,
* It is time to return to the buyer, and see what kind of checks it needs to do before it accepts to sign such a momentous transaction. First the buyer should be able to see again all the states it knew about in the preceding steps. Starting with the inputs, which include the car and the _dollar states_:

    ```java
    final Set<StateRef> allKnownInputs = inputsAndOutputs.getFirst().stream()
            .map(StateAndRef::getRef)
            .collect(Collectors.toSet());
    allKnownInputs.add(heldCarToken.getRef());
    ```
* How does it compare with the inputs in the transaction sent by the seller? By using the `Set.equals` function:

    ```java
    final Set<StateRef> allInputs = new HashSet<>(stx.getInputs());
    if (!allInputs.equals(allKnownInputs))
        throw new FlowException("Inconsistency in input refs compared to expectation");
    ```
* Then moving to the outputs, we should at least have the same count as our _dollar states_ plus the output for the car itself:

    ```java
    final List<ContractState> allOutputs = stx.getCoreTransaction().getOutputStates();
    if (allOutputs.size() != inputsAndOutputs.getSecond().size() + 1)
        throw new FlowException("Wrong count of outputs");
    ```
* Beyond the count, make sure the seller did not try to increase the quantity on the states, so as to swindle the buyer into paying more, or with a different currency:

    ```java
    final List<FungibleToken> allCurrencyOutputs = allOutputs.stream()
            .filter(it -> it instanceof FungibleToken)
            .map(it -> (FungibleToken) it)
            .filter(it -> it.getIssuedTokenType().equals(issuedCurrency))
            .collect(Collectors.toList());
    if (!inputsAndOutputs.getSecond().equals(allCurrencyOutputs))
        throw new FlowException("Inconsistency in FungibleToken outputs compared to expectation");
    ```
* What about the car? It was checked in input, how about in output? Let's start with the count of states:

    ```java
    final List<NonFungibleToken> allCarOutputs = allOutputs.stream()
            .filter(it -> it instanceof NonFungibleToken)
            .map(it -> (NonFungibleToken) it)
            .collect(Collectors.toList());
    if (allCarOutputs.size() != 1) throw new FlowException("Wrong count of car outputs");
    ```
* Is it the same car?

    ```java
    final NonFungibleToken outputHeldCar = allCarOutputs.get(0);
    if (!outputHeldCar.getLinearId().equals(heldCarToken.getState().getData().getLinearId()))
        throw new FlowException("This is not the car we expected");
    ```
* And is the buyer the owner, eventually?

    ```java
    if (!outputHeldCar.getHolder().equals(getOurIdentity()))
        throw new FlowException("The car is not held by us in output");
    ```
* Add additional tests for the commands, to make sure that there is no redeem command, for example:

    ```java
    final List<Command<?>> commands = stx.getTx().getCommands();
    if (commands.size() != 2) throw new FlowException("There are not the 2 expected commands");
    final List<?> tokenCommands = commands.stream()
            .map(Command::getValue)
            .filter(it -> it instanceof MoveTokenCommand)
            .collect(Collectors.toList());
    if (tokenCommands.size() != 2)
        throw new FlowException("There are not the 2 expected move commands");
    ```
    Other malformations on the commands will be caught by the contract. This closes the long checks performed by the buyer before signing the transaction.
* Back to the seller, which received the buyer's signature, it is time to notarize the transaction:

    ```java
    final SignedTransaction notarised = subFlow(new FinalityFlow(
            fullySignedTx, Collections.singletonList(buyerSession)));
    ```
* Before informing the relevant parties about the concluded change in ownership:

    ```java
    subFlow(new UpdateDistributionListFlow(notarised));
    ```
    `UpdateDistributionListFlow` is an `@InitiatingFlow`, so there is no need to call its counterparty from the buyer's flow.
* And, to conclude by returning the required object:

    ```java
    return notarised;
    ```
* Which is why, back in the buyer's flow, we finish off with:

    ```java
    return subFlow(new ReceiveFinalityFlow(sellerSession, signedTxId));
    ```

## Conclusion

This is a seriously long flow with a lot of back and forth, and a thorough list of checks that demonstrate a degree of adversarial thinking, and limited trust in what is coming from the other side.

The tests included are limited. In particular, they do not check for the many error conditions. To be able to test them all, the flow could, for instance, split the logic into separate `protected` functions. Then, bespoke child classes would wrongly modify these logic pieces in order to trigger an error point.

As always, there is no single truth, and it is in fact possible to imagine a flow that, while creating an identical transaction, unfolds a little bit differently, and is left here as an optional exercise. In the example above, the seller is always "in control", meaning:

* The seller initiates.
* The seller sends the car and currency information to the buyer.
* The seller asks information from the buyer in return.
* The seller creates the transaction.
* The seller asks for a signature from the buyer.
* And then the seller finalizes.

How about you flip it mid-way:

* The seller initiates.
* The seller sends the car and currency information to the buyer.
* The buyer collects the _dollar states_, but does not send them.
* The buyer creates the transaction and signs it.
* The buyer asks for a signature from the seller.
* The seller checks the transaction, similarly to what the buyer was previously doing.
* The seller signs the transaction and sends it back to the buyer.
* The buyer finalizes.

You see that the buyer does not send back the _dollar states_ but instead uses them right away. Interestingly, the `CollectSignaturesFlow` is triggered from the buyer's end, i.e. from the responder end.

In the end, this _flipped_ flow does not solve the 2 pending safety checks anyway, namely:

* Is the car received by the buyer, the car the buyer intended to buy?
* Is the issued currency type received by the buyer, the one intended by the buyer?
