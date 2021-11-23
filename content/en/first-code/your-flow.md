---
title: Your first Corda flow
description: Create a flow
slug: your-flow
menu:
  main:
    parent: first-code
    weight: 50
weight: 50
---


You should be satisfied with your token state and contract, and their tests. Proceeding to flows before States and Contracts are finalized is not recommended.

The flows you are about to create will make your air-miles system operational at a basic level. They are to implement the business&nbsp;/ orchestration layer of the air-miles. You are not aiming for integration with legacy systems, or at creating flows that allow the user to use the whole space allowed by the contracts. Instead, you are aiming at 3 flows that make it possible to issue, move and redeem tokens. The primary goal here is to make it work, including unit tests.

The beauty of flows is that when you have addressed the basic flows, you can keep them on the side while you create new flows that will allow your users to achieve more. This is conceptually different from states and contracts where you basically need to get it right from the outset. You can also reuse well-designed flows by composition. So do not hesitate to start small and _prove the concept_ before you create more ambitious flows.

## First flow

Let's take the example of a simple flow that issues a single `TokenState` instance. "All" it needs to do is to:

* Take an `issuer`, a `holder` and a `quantity`.
* Create a transaction.
* Validate the transaction.
* Have the transaction signed by the issuer.
* Send the transaction to the holder.

It sounds like a reasonably-sized bit of work. Not inconsequentially, it does the job without sprawl. It already forces you to create a responder flow, very much like the IOU create flow in the previous module. Don't hesitate to peek at this walk-through and take inspiration from it.

Try creating this flow and unit test first. Go!

{{<ExpansionPanel title="Some hints, resist the urge to look">}}

The flow has 2 main action areas: the constructor and the `call` function.

1. In the constructor, you pass the simple objects, like `issuer`, `holder` and `quantity`.
2. In the `call` function, it looks very much like what you saw in the IOU contract example:
    * Use a transaction builder.
    * Add to it the elements required by the contract.
    * Ask your service hub to confirm the resulting transaction would be valid.
    * Sign it with your key. (Unlike the IOU example, you do not need to collect another signature)
    * At the end, run the `FinalityFlow`.

There needs to be a responder flow, since you called the finality flow. This responder simply sub-flows the finality flow handler.

{{</ExpansionPanel>}}

## Second flow

When you are done with the first one, you can be a wee bit more ambitious. What about a second flow that issues tokens from 2 issuers? It would have to:

* Take `TokenState` information, full or partial.
* Create a transaction.
* Validate the transaction.
* Have the transaction signed by the issuers.
* Send the transaction to the holder(s).

Careful, there may be a trap here. Flows represent business processes, so think about whether an airline would want to use your flow. What actions express an airline's intent? Think adversarially again. Maybe a rogue airline or passenger could try to trick an airline into signing a transaction that does not break the contract but is nonetheless not desired.

{{<HighlightBox type="tip">}}

**Peek at the solution?**

When you have created, and tested your Issue flow(s), how about you have a look at the Issue flow solution? Only this one! It will help avoid gross mistakes you might repeat with the other flows.

{{</HighlightBox>}}

## Other flows

After these first wins, it will be time to add flows for `Move` and `Redeem`:

* At a minimum, your move flow should allow Alice, who owns 20 tokens to move 2 of them to Bob.
* For redeem, keep in mind that if you want to redeem 20, you may have a single `TokenState` instance of 40. So don't trick your users into redeeming more than they were thinking they were.

Work on your own before checking the example solution in the next section. You will gain most by struggling first and taking inspiration from the cordapp-example.

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

Think about what flows you could add that would reuse some of yours. What sub-classing do you have in mind.

Go wild, your ledger layer is safe.

{{<HighlightBox type="support">}}

Get 3 months access to the authors and experts who created this training.

* Expert instructors will review your code and help you to refine it.
* One-on-one support and mentoring from expert instructors.
* Collaboration with fellow students in a dedicated Training Slack channel.

<div class="cta-wrapper">
<a href="/in-closing/get-paid-support/" class="cta-button">Learn More</a>
</div>

{{</HighlightBox>}}
