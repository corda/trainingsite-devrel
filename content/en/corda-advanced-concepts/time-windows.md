---
title: Time-Windows
description: Know when a transaction happened
slug: time-windows
aliases: [
  "/corda-details/time-windows/"
]
menu:
  main:
    parent: corda-advanced-concepts
    weight: 50
weight: 50
---

In the previous exercise, you created a CorDapp with a sales proposal. It was noted that the following annoyances are still present:

* The seller can surreptitiously reject the proposal at any time without letting the buyer know.
* The buyer has all the time in the world to scrutinize the offer.

Would it not be good to put time limits on both? For instance:

* The proposal has an expiration date.
* The buyer can only accept before expiration.
* The seller must honor the contract if the offer is accepted before expiration.

Yes, that would be an improvement. Is it enough to add this _expiration date_ as a field in the sales proposal? For information purposes only, sure. But how would you enforce it?

## Time in DLTs

As you learned in the fundamentals module, time in Distributed Ledger Technologies (DLTs) has an unusual meaning. Recall that you have a collection of nodes with unsynchronized clocks. Which one do you consider the authoritative source of "correct time?"

The short answer is, **none**!

The long answer is, which entity or process are we going to trust with deciding time?

In the case of Corda, the decision made for us is to use notaries. They are already used to provide authority about consumed states. They are also used for time-stamping. Obviously, it is in the best interest of a notary operator to provide an accurate service and this principle extends to time.

How do you ask for the time from a notary?

## Time-windows

Corda introduced the concept of _time-windows_, which have a beginning and an end. Or a beginning and no end, or an end but no beginning. When such a time-window is set on the transaction, the notary will be contacted and asked to sign. The notary will do so only if **its** current time falls within the time-window, and it will return an error if its time does not. This is something to remember if your flow involves some back and forths for data and signature collection. Specify a wide enough time-window, especially if the other nodes may be busy or flaky.

So the notary does not provide time, it signs if its time falls inside the window. A time-window is:

1. Open-ended when the transaction must happen before a certain time, or the transaction must happen after a certain time.
2. Close-ended when the transaction must happen after a certain time **and** before a certain time.

At the time of notarisation and in the future, a party looking at the historical trail of transactions will have the assurance that the transaction was notarized during the specified time-window.

* The implementation of `TimeWindow` is done with [2 nullable `Instant` instances](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/contracts/TimeWindow.kt#L57-L60), which represent both ends of the window. There are some [utility functions](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/contracts/TimeWindow.kt#L27-L53) to facilitate their creation, such as:
    * `TimeWindow.untilOnly(someInstantInTheFuture)`
* As for the [`Instant` class](https://docs.oracle.com/javase/8/docs/api/java/time/Instant.html), it too has some facilities such as:
    * `Instant.now()`, which returns current time in UTC.
    * `Instant.now().plus(Duration.ofMinutes(10))`, which is self-explanatory.
    * `Instant.now().minus(1, ChronoUnit.DAYS)`, another way to modify instants.

## Conclusion

Time-windows are an accommodation of the limitations of DLTs. They force notarisation within a range of time. When combined with states and contracts, they can be used to enforce complex time thresholds.

In the next chapter you will look at an example implementation of time windows in the project.

## Reference links

* Documentation on [time-windows](https://docs.corda.net/docs/corda-os/4.3/key-concepts-time-windows.html#time-windows).
