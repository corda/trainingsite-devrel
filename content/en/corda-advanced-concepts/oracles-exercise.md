---
title: Oracles Exercise
description: Will your car be towed away?
slug: oracles-exercise
aliases: [
  "/corda-details/oracles-exercise/"
]
menu:
  main:
    parent: corda-advanced-concepts
    weight: 120
weight: 120
---


{{<ExpansionPanel title="Code">}}

You may start this exercise by working from: https://github.com/corda/corda-training-code/tree/master/070-services

{{</ExpansionPanel>}}

Now that you know about Corda services and oracles, it's time to use them for a practical purpose.

Continuing with the car sales exercise, consider a routine due diligence step.

Car purchases are often financed by lenders to accept the car itself as collateral. The agreement between the borrower and the lender usually entitles the lender to seize the vehicle if the borrower fails to pay the loan, as agreed. This privilege, called a **lien**, remains with the vehicle even after it is sold, otherwise the lender would have no assurance that collateral exists.

A buyer is well-advised to check for liens before finalising the purchase. But, how can one confirm the non-existence of another agreement?

A registry is a traditional solution to this problem. Legal and regulatory structures incentivize lenders (e.g. by enhancing enforceability) to report their liens to a registrar which in turn facilitates quick searches using one system of record. In most jurisdictions this is the DMV or a similar government agency.

So, it is advisable for the buyer to check the Registry to confirm that no liens exist before sending currency to pay for the car.

## Simplified project exercise

We will assume that the buyer merely wants assurance that the car is "free and clear" of any liens before finalising the transaction. If a lien exists, it is the seller's responsibility to remove it before accepting the offer. In this way, buyers can offer to purchase cars even when a lien exists, but buyers must remove all liens before accepting offers, and sellers will check for liens before sending funds.

There will be a registry that returns whether there is a lien on a given vehicle. For the purpose of this simplified implementation, it will be sufficient if the registry returns the equivalent of a boolean to indicate if any liens exist.

You have to make design decisions:

* As to whether to create new elements or modify existing ones.
* And&nbsp;/ or where to include this _oracle_, whether in states, contracts and&nbsp;/ or flows (and tests!).
* As to how best to unequivocally express the intents of the different parties.
* Whether your system will allow strange and unforeseen contractual situations to which parties might acquiesce.

Go! No peeking to a solution on the next chapter.

## Advanced project exercise

<!-- This is a possibly too tricky for a good example and explanation -->

Are you ready for a challenge?

Vehicles can be quite expensive, and sellers are not always able to remove liens (by repaying the loan) until the proceeds of the sale are in hand. A way to think about this is that the sale is contingent on the seller using some of the funds to eliminate the liens. That means the lenders have to receive the funds, agree that the loan(s) is fully paid off and remove the lien from the registry.

Here, you can start to see the power of DLT. This process normally involves both buyer and seller engaging in multiple interactions with several parties (a.k.a. running around) and a DLT can encapsulate the sale process in an atomic transaction with multiple parties.

1. The buyer accepts the offer, contingent on no liens.
2. Funds are sent by the buyer.
3. Some of the funds (or all, or possibly even funds from another source) go to repay all outstanding loans, contingent on the removal of registered liens.
4. The lender removes the liens from the registry and accepts the funds.

The eventual outcome of the above atomic transaction is:

> There are no liens, the seller has the remaining funds, and the car is transferred to the buyer.

The IOU project is a good starting point for a simplistic lending agreement. The fully repaid IOU is similar (though admittedly simpler) to a car loan. You will have to add lists of the unpaid IOUs to your DMV and arrange it so:

1. Only lenders can register a lien, and perhaps only with the car owner's consent.
2. Only lenders can remove a lien, but doing so should be mandatory if the IOU is paid in full.

Go! No peeking to a solution on the next chapter.

