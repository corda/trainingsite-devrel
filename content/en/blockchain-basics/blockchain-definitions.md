---
title: Blockchain definitions
decription: Conceptual foundations
slug: blockchain-definitions
aliases: [
  "/fundamentals/blockchain-definitions/"
]
menu:
  main:
    parent: blockchain-basics
    weight: 30  
weight: 30
---

In this section, you will learn about the current definitions of blockchain. In the few years since the technology was conceived, there has been a rapid flourishing of new terms and concepts. Now that you have learned about Distributed ledger technology, these definitions will make more sense.

## Transactions

A transaction is an atomic event - an event whose parts make no sense in isolation. Every step in an atomic transaction must execute or the entire transaction must not execute.

If the word _transaction_ conjures up a financial transaction in your mind, this is indeed appropriate. For instance, a single transaction may be described as follows:

* Reduce account A by $10.
* Increase account B by $9.
* Increase account C by $1.

You immediately understand this transaction as a payment. If you were told only part of that, for example, "reduce account A by \$10," you would rightfully ask where did those \$10 go? This is what it means to be atomic.

If the word _transaction_ conjures up a SQL transaction in your mind, this too is appropriate. For example, technology permitting a single transaction may be described as follows:

* Charge customer \$10.
* Ship 1 widget.
* Add 1 en-route shipment for the customer.
* Reduce widget stock by 1.

In the context of blockchain, a transaction is an atomic event that is allowed by the underlying protocol.

## Consensus Mechanism

A blockchain is a well-ordered set of data, on which all peers *eventually* agree.
What all participants agree upon is construed as the single truth.
This single truth is the single true state of the distributed ledger. The process through which the peers agree upon the single true state is the Consensus Mechanism.

![Consensus Network](/blockchain-basics/blockchain_as_a_consensus_network.png)

## Smart Contracts

Considering a computer, how do you describe how it works? It takes commands then executes them in an ordered and deterministic fashion. The sequence of execution determines the state the computer is in.

Ethereum is a blockchain that implements Turing-complete Smart Contracts. Hyperledger Fabric is similar in this regard. Each transaction is in effect a command, and the "execution" of all these commands results in the virtual computer's next state. Ethereum defines a distributed state machine, a world computer, the state of which is agreed upon by all nodes.

With this introduction, a smart contract is a program on the world computer, a distributed application (or DApp) is one too, as is a coordinated collection of smart contracts.

This type of computer is not well-suited to replace traditional servers for a number of performance and capacity reasons but it is especially good at securing critical checkpoints concerned with crucial information.

![Blockchain as a computing paradigm](/blockchain-basics/Blockchain_As_A_Computing_Paradigm.png)

## Distributed Databases

In the history of computing, data storage and network have long been kept separate, essentially because the former was adopted long before the latter.

Storage was then *connected* to the network.

Blockchain merges these two concepts into one by combining elements of databases with a P2P network.
Data in a blockchain is present wherever there is connectivity. Combined with smart contracts, this enables the creation of stateful protocols.

Blockchain also describes a network topology, since it relies on P2P networking.

This has immense implications on the techno-social systems building on top of the technological layer.

See Vinay Gupta elaborate on the [significance of blockchains](https://vimeo.com/161183966).

## Distributed vs. Decentralized

The degree of decentralization has vast implications for the functioning of a network.

There is great debate as to what properly constitutes distributed as opposed to decentralized systems. In addition, systems can in fact be a mix of both.

In 1964, before major discoveries and developments such as public-key cryptosystems and P2P networking, Paul Baron published a paper [*On Distributed Communications*](https://www.rand.org/content/dam/rand/pubs/research_memoranda/2006/RM3420.pdf).
In it, he attempted to differentiate between diverse degrees of decentralization.
Networks could be either centralized, decentralized, or distributed.

![Paul Baran Networks](/blockchain-basics/network-structure.png)

In Baran’s conceptualization of the degree of centralization, he identified a spectrum of network topologies - centralization and decentralization were attributes introduced long before to describe political systems and power structures.

The main point of differentiation is the number of so-called points of failure.

Centralized networks have a single point of failure. Reducing points of failure reduces centralization and leads to a fully distributed network.

A point of failure can be understood as a node or part of a system, respectively a network, which upon failing leads to the whole system/network shutting down and/or no longer being able to perform the intended operations.

After Baran’s topology and accompanied by developments in regard to networks, databases, computing, and cryptography, a more detailed continuum of typologies was proposed.
Among other aspects, the importance of resource and power control was emphasized.


Before one line of code is written, centralized, decentralized, and distributed topologies imbue networks and their applications with advantages and disadvantages, strengths and limitations. Expect to take care weighing options and considering the implications of network topology and application design.

Given a topology and design, what factors are immutable and what factors are subject to future revision? Upon what assumptions does the long-term viability of the system rest? How is authority and control distributed and is that structure likely to be acceptable to participants who compete with each other in other realms?

What does the design ask the participants to trust? In the case of an immutable system with software that is not easily revisable, it might be the correctness of the contracts and the long-term stability of the platform. In the case of systems that are more flexibly open to revision, it will often lead to consideration of governance. Who or what decides about future revisions, and how do they or it decide it? What is open to revision and what is invariant? How do participants know the invariants cannot be violated?
