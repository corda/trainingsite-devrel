---
title: Time-Windows Exercise
description: Enforce an expiration date
slug: time-windows-exercise
menu:
  main:
    parent: corda-details
    weight: 70
weight: 70
---


{{ {{<ExpansionPanel title="Code">}} }}

You may start this exercise by working from: https://github.com/corda/corda-training-code/tree/master/050-ref-state

{{</ExpansionPanel>}}

In the previous chapter, you learned about enforcing a time-window to ensure that a transaction is notarized within a range of acceptable times.

Now, how do you use this enforcement of a time-window to make the car sales flow more robust and enforce the expiration date on the sales proposal? What you want to achieve is:

* The proposal has an expiration date.
* The buyer can only accept before this date.
* And the seller can only reject the acceptance after this date.

Try to implement that on your own before looking below.

---

The way to go is:

* The `SalesProposal` defines an expiration date as a point in time in the future.
* The offer flow adds to the transaction a time-window with an "until" end.
* On `Offer`, the contract checks that the expiration date is after this "until" end. If it is not, the buyer is not able to buy.
* The accept flow adds to the transaction a time-window with an "until" end too.
* On `Accept`, the contract checks that the expiration date is after this "until" end.
* The reject flow adds to the transaction a time-window with a "from" end too.
* On `Reject`, the contract checks that the expiration date is before this "from" end.

As you can see:

* The contract verifies that the time-window is on the right side of the expiration date.
* The notary verifies that it is signed within the time-window.

The interaction of these 2 attestations in effect enforces the expiration date.

Go ahead and add an expiration date to your project before moving on to the next chapter for an example solution.

{{<HighlightBox type="support">}}

Get 3 months access to the authors and experts who created this training.

* Expert instructors will review your code and help you to refine it.
* One-on-one support and mentoring from expert instructors.
* Collaboration with fellow students in a dedicated Training Slack channel.

<div class="cta-wrapper">
<a href="/in-closing/get-paid-support/" class="cta-button">Learn More</a>
</div>

{{</HighlightBox>}}
