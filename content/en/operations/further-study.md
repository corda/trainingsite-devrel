---
title: Further studies
description: Visit the rabbit hole of Corda operations
slug: further-study
menu:
  main:
    parent: operations
    weight: 70  
weight: 70
---

## Changing the Notary on States

There are certain cases where a notary change is required. For instance, if you are trying to add a reference state that uses a different notary than your input states; those input states' notary must be changed to match that of the reference state, because in order to use a reference state in your transaction; the notary should be able to attest that it is an unconsumed state.
Since (usually) you don't have control over the reference state, but you do have control over the input states; then you change the notary of the latter.
In order to change the notary, you simply call the `NotaryChangeFlow` which will collect the approvals (i.e. signatures) from the participants of the state.

## PostgreSQL

Now that you have a running Corda server, you should know that it uses a local H2 persistent database. H2 is an open-source lightweight Java database mostly used for development and testing. Perhaps you want a more durable database. In this case, you can use PostgreSQL, as explained [here](https://docs.corda.net/docs/corda-os/4.5/node-database.html).

Cloud computing providers offer this database as a managed service. _Managed service_ means that, for a small fee, they take care of the nitty-gritty of keeping your database server up and patched, at your preferred version. From there, what you need to connect your Corda to it is:

1. The JDBC driver.
2. The access parameters.
3. Grant your Corda server access to the database.

For point 3, as well as user/password, you should leverage the cloud provider's policy tools that grant access to the database to only your Corda server, for instance.

To  learn more, see these blog posts about the db perspective for [development](https://medium.com/corda/cordapp-database-setup-development-perspective-1c572adf5957) and [production](https://medium.com/corda/cordapp-database-setup-production-perspective-2c400e60fae5).

## Flow Hospital

You know that not all plans unfold as expected, especially with networked applications. This is true of flows. For instance, a JAR may be missing, the database may be unavailable, the counterparty may have been evicted from the network map, etc. What should your flow do in this case? The R3 team has divided such errors into 2 buckets:

1. Those errors that may be recoverable or fixed at some point in the future.
2. Those that are not.

When your flow encounters an error of the first type, it is sent to the flow hospital. The [flow hospital](https://docs.corda.net/docs/corda-os/4.5/node-flow-hospital.html) is a built-in node service that retries your flow from the last checkpoint.

Before Corda 4.4, the [list of errors](https://docs.corda.net/docs/corda-os/4.5/node-flow-hospital.html#run-time-behaviour) that sent a flow to the hospital was fixed, and the developer had no way of controlling that. With the new release, if the developer “catches an exception” that they believe can be fixed, they can raise a `HospitalizeFlowException` to send the flow to the hospital. That will allow it to be replayed from the last checkpoint once the problem is resolved.

A practical example would be your flow calls an API, and that call times out before it gets a response. In this case the API server might simply have been down. So instead of throwing a `FlowException` and terminating your flow, you may want to replay the flow again hoping that the server is back online later. If you judiciously combine this with a forced checkpoint like `sleep(sometime)` right before the API call, you can have your flow restart exactly where it left off. For instance, in [this example](https://github.com/corda/corda-settler/blob/b1a667fbad17666ef56862b00d5b16a460ad2b5c/modules/ripple/src/main/kotlin/com/r3/corda/finance/ripple/flows/MakeXrpPayment.kt#L86-L90), doing so avoids recreating a sequence number.

## Conclusion

Operations on Corda is a rapidly evolving subject, so be sure to regularly [peruse the docs](https://docs.corda.net/docs/corda-os/4.5/corda-nodes-index.html).
