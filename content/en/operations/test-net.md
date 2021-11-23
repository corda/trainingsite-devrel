---
title: Get on the Testnet
description: Become a well-known party
slug: test-net
menu:
  main:
    parent: operations
    weight: 30
weight: 30
---

The Corda Testnet is a network with properties that are very similar to a production setting. It is accessed over the Internet and is suitable for non-production testing and demonstration purposes. Let us clarify the meaning of "network" in this context.

In Corda parlance, a _network_ is the logical concept of Corda nodes that, over the internet:

* Can call each other, because they know which remote IP and port to call.
* Recognize each other, because the keys and certificates were obtained before a call was made.
* Run with a common set of network parameters and versions.

To disambiguate the term _network_, Corda also uses the term [_compatibility zone_](https://docs.corda.net/docs/corda-os/4.5/compatibility-zones.html). When part of a compatibility zone, these nodes recognize each other's certificates as being part of the zone. How do nodes obtain each other's certificates?

## Network map

The remote nodes' info and certificates are obtained via what is called the [network map](https://docs.corda.net/docs/corda-os/4.5/network-map.html). Where map is to be understood in the same way as a Java `Map` with:

* The value being a signed `NodeInfo`.
* The key being a hash of the corresponding `NodeInfo`.

See [here](https://api.corda.net/api/corda-os/4.4/html/api/kotlin/corda/net.corda.core.node/-node-info/index.html) for properties of `NodeInfo`.

This map can be a straightforward file saved to disk, or obtained by an HTTP service running on a well-known node. Either way, this network map works like a rather static phone book, where additions and removals are made. Note that when a node goes offline, it does not get removed from the map. Eviction for being offline too long is a parameter of the zone that needs to be decided.

How do you get your own info into the network map in the first place?

## Doorman

A zone has a [hierarchy of certificates](https://docs.corda.net/docs/corda-os/4.5/cipher-suites.html). The doorman is the service that adds your node's certificate to the network map. For the doorman to accept your node, your node needs to:

* Create its own keys and certificate.
* Have it signed by the doorman.

Preventing man-in-the-middle attacks and enabling meaningful onboarding processes can be a complex undertaking. The Corda Testnet is an alternative to addressing such concerns yourself in a pre-production setting.

## Testnet

Corda Testnet is a compatibility zone and an open public network of Corda nodes on the internet. It provides notary and network map services so you can deploy your nodes on separate machines and test them in a near-production setup. Since this is a lower-security zone, the network map and doorman systems are automated. In effect, deploying your node onto Testnet consists of the following steps:

1. You register with the R3 marketplace for an account. It's free.
2. You create a (future) node through the Web interface.
3. You get a one-time-download-key that will let your node be accepted by the doorman automatically.
4. You run the given script, which will do the necessary, including using the key to add your node.

You read in more detail [here](https://docs.corda.net/docs/corda-os/4.5/corda-testnet-intro.html). So go ahead and do steps 1, 2 and 3. When at step 3, in effect, you save, for future use, a command of the type:

```shell
sudo ONE_TIME_DOWNLOAD_KEY=a1b2c3d4-a1b2-a1b2-a1b2-a1b2c3d4e5f6 bash -c "$(curl -L https://onboarder.prod.ws.r3.com/api/user/node/TESTNET/install.sh)"
```

Corda also provides Prod and Pre-Prod networks. They have a special joining process, and fees to use their services such as  notary. Read about them on this [dedicated website](https://corda.network/).

What about step 4 above? That's the subject of the next chapter.
