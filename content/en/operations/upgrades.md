---
title: CorDapp upgrades
description: What to do
slug: upgrades
menu:
  main:
    parent: operations
    weight: 60
weight: 60
---

Creating a CorDapp is enough work already, why worry about upgrades? Because if your app is successful, then over its long life it will have to adjust.

What could need changing or upgrading?

1. **Your Corda node**. If backward compatibility is maintained by the R3 team, then node upgrades [should be](https://docs.corda.net/docs/corda-os/4.5/api-stability-guarantees.html) painless. [Make sure](https://docs.corda.net/docs/corda-os/4.5/app-upgrade-notes.html), though. No one can be certain that there will never be a breaking change.
2. **Your CorDapp's self-knowledge**. You may test it again for regression for a new Corda version, and then [advertise this fact](https://docs.corda.net/docs/corda-os/4.5/versioning.html).
3. **The network parameters**. As the network, on which your app runs [evolves](https://docs.corda.net/docs/corda-os/4.5/network-map.html#network-parameters), your node and your app need to be compatible with them. Possibly adjusting your unit tests too.
4. **The flows**. Eventually, you may want to review them, such as add or remove features. Unlike a state, and the contract that controls it, an in-flight flow is not a long-lived entity. Therefore as long as you have [_drained your node_](https://docs.corda.net/docs/corda-os/4.5/upgrading-cordapps.html#flow-drains) of old in-flight (checkpointed) flows, you can swap out the JARs. If you also change the [_interface_](https://docs.corda.net/docs/corda-os/4.5/upgrading-cordapps.html#what-defines-the-interface-of-a-flow) you will need to explicitly make them [backward compatible](https://docs.corda.net/docs/corda-os/4.5/upgrading-cordapps.html#what-constitutes-a-non-backwards-compatible-flow-change).
5. **The states and contracts**. Perhaps you want to add a field, a command, or update the checks. Unlike flows, states are long lived and need to be verified in the future. For past states, as long as the JAR, referenced by hash in the transaction, is available somehow, the transactions that created them can be verified. But for your new states, can you just force a new JAR for a transaction that consumes your older state? If you signed your CorDapp, [then yes](https://docs.corda.net/docs/corda-os/4.5/api-contract-constraints.html), it is as easy as replacing your contracts CorDapp with its next version in the `cordapps` folder.
6. **States schemas**. If you implemented [a schema](https://docs.corda.net/docs/corda-os/4.5/api-persistence.html) to your state, you may have to [make an effort](https://docs.corda.net/docs/corda-os/4.5/upgrading-cordapps.html#state-schemas).
7. **Your db**. See these guides on db migration from a [development](https://medium.com/corda/cordapp-database-upgrade-migration-development-perspective-c2931e28b9b4) and [production](https://medium.com/corda/cordapp-database-upgrade-migration-production-perspective-5f655838492d) perspectives. With the associated videos [1](https://www.youtube.com/watch?v=0BKUUY4Tg20) and [2](https://www.youtube.com/watch?v=69un7I-Amwc).

Unfortunately, to test your upgrade procedures, you will have to [deploy a local test network](https://docs.corda.net/docs/corda-os/4.5/upgrading-cordapps.html#testing-cordapp-upgrades), perhaps via `deployNodes`, and perform the upgrade there.
