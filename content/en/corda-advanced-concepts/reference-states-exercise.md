---
title: Reference States Exercise
description: A truly atomic car sale
slug: reference-states-exercise
menu:
  main:
    parent: corda-advanced-concepts
    weight: 30
weight: 30
---


{{<ExpansionPanel title="Code">}}

You may start this exercise by working from: https://github.com/corda/corda-training-code/tree/master/040-accounts-lib

{{</ExpansionPanel>}}

Your previous iteration of the car sales exercise improved it by making the swap of _car for money_ an atomic transaction that is usable even with accounts. As noted at the time, the following points were left unresolved on the buyer side:

```java
// TODO have an internal check that this is indeed the car we intend to buy.
// TODO have an internal check that this is indeed the currency we decided to use in the sale.
```
The problem stems from the fact that the buyer flow is a **responding** flow. At no point is it demonstrated that the human buyer **intends** for the sale to take place. In this previous version, the buyer receives the price, fetches enough tokens to cover that amount, then sends them back to the seller. Basically, the buyer is accepting any car at any price. That's not how things work in the real world.

In the world of Corda, a party's intention is naturally expressed by said party **initiating** a flow. But, here, if the buyer initiates a flow, then the same questions face the seller, who is merely responding.

Ok, you need 2 initiating flows, 1 for the seller and 1 for the buyer. Each flow will encapsulate each respective party's intentions. Come to think of it, this is similar to how you imagine a sale taking place. An offer is made, this offer is received and scrutinized, and then in turn it is accepted or rejected. It can be a sale offer or a buy offer.

In this version of the atomic sale, you will use the knowledge you acquired about reference states to implement the following solution:

1. The seller will `Offer` a `SalesProposal` to the buyer, encapsulating their intent in this new state.
2. The `SalesProposal` _expects_ a `NonFungibleToken`, the car in our case, as a **reference state** on `Offer`, which additionally proves ownership.
3. Now that the buyer has the proposal in their vault, they can review it, and either `Reject` the `SalesProposal`,
4. Or, `Accept` it as part of the atomic sale flow which will now be initiated by the buyer.

This is a high-level introduction and it's left to you to place appropriate validations in suitable locations, in important contracts and flows, old and new. See if you can work this out on your own before peeking at the solution.

Go!

