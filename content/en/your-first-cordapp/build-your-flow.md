---
title: Build Your Flow
description: Create a flow
slug: build-your-flow
aliases: [
  "/first-code/your-flow/"
]
menu:
  main:
    parent: your-first-cordapp
    weight: 40  
weight: 40
---


You should be satisfied with your IOU state and contract, and their tests. Proceeding to flows before States and Contracts are finalized is not recommended.

The flows you are about to create will make your CorDapp operational. They are to implement the business/orchestration layer. You are not aiming for integration with legacy systems, or at creating flows that allow the user to use the whole space allowed by the contracts. Instead, you are aiming at 3 flows that make it possible to issue, transfer and settle IOUs. The primary goal here is to make it work, including unit tests.

The beauty of flows is that when you have addressed the basic flows, you can keep them on the side while you create new flows that will allow your users to achieve more. This is conceptually different from states and contracts where you basically need to get it right from the outset. You can also reuse well-designed flows by composition. So do not hesitate to start small and _prove the concept_ before you create more ambitious flows.

## First flow

Let's take the example of a simple flow that issues a single `IOUState` instance. "All" it needs to do is to:

* Take a `lender`, a `borrower`, and an `amount`.
* Create a transaction.
* Validate the transaction.
* Have the transaction signed by the counter-party
* Finalize the transaction

It sounds like a reasonably-sized bit of work. Not inconsequentially, it does the job without sprawl. It already forces you to create a responder flow

Try creating this flow and unit test first. Go!

{{<ExpansionPanel title="Some hints, resist the urge to look">}}

The flow has 2 main action areas: the constructor and the `call` function.

1. In the constructor, you pass the individual values or you could pass the state
2. In the `call` function:
    * Use a transaction builder.
    * Add to it the elements required by the contract.
    * Ask your service hub to confirm the resulting transaction would be valid.
    * Sign it with your key
    * Collect other party’s signature with the `SignTransactionFlow`
    * At the end, run the `FinalityFlow`.

There needs to be a responder flow since you called the sign transaction flow and the finality flow. This responder simply sub-flows the sign transaction flow and the finality flow handler.

{{</ExpansionPanel>}}

## Second flow

When you are done with the first one, you can be a wee bit more ambitious. What about a second flow that transfers IOU from an old lender to a new one? For Eg, your Transfer flow should allow Alice who is the lender in an IOU transfer the IOU to Charlie.

It would have to:
* Take `IOUState` information, full or partial.
* Create a transaction.
* Validate and sign the transaction.
* Collect signature from the new lender and borrower.
* Send the transaction to all the participants.

{{<HighlightBox type="tip">}}

**Peek at the solution?**

When you have created and tested your Issue flow(s), how about you have a look at the Issue flow solution? Only this one! It will help avoid gross mistakes you might repeat with the other flows.
{{</HighlightBox>}}

## Settle flows

The Settle flow should either end the obligation or settle a part of the obligation. Both parties must agree to this settlement.

Work on your own before checking the solution given below. You will gain most by struggling first and taking inspiration from the cordapp-example

{{<ExpansionPanel title="A hint, resist the urge to look">}}

In addition to what you did in the issue flow(s), these move and redeem flows need to collect a signature from a counterparty. Look again at how this was done in the IOU contract example.

{{</ExpansionPanel>}}

## Challenge yourself

And just like that, in 3 headers, you are let loose to work on flows for many hours... If that is not enough information for you, remember that flows can:

* Be customized by peers:
    * By sub-classing the `@InitiatingFlow` flow.
    * By sub-classing the well-known `@InitiatedBy` flow.
    * Or by declaring an entirely new flow instead of the well-known `@InitiatedBy` flow.
* Be combined to be 1 moving part of a bigger orchestration, just like `CollectSignaturesFlow`.

Think about what flows you could add that would reuse some of yours. What sub-classing do you have in mind?

Go wild, your ledger layer is safe.
