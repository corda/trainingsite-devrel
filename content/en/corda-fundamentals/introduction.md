---
title: Introducing Corda
description: Discover the Corda platform
slug: introduction
aliases: [
  "/key-concepts/introduction/"
]
menu:
  main:
    parent: corda-fundamentals
    weight: 10  
weight: 10
---

## Introduction

Corda is a permissioned "distributed ledger" coupled with a workflow messaging network. It was originally built with regulated financial institutions in mind. Corda is a platform for creating interoperability in enterprise settings. Its impressive scalability, transaction privacy, state consistency, and workflow flexibility are suitable for a wide variety of enterprise settings including capital markets, trade finance, digital identity, insurance, healthcare, government, supply chain, and telecommunications.

The word "blockchain" is almost synonymous with cryptographically secured distributed ledgers. Corda is sometimes described as a blockchain or compared to other blockchains. While this categorisation is not completely accurate at the level of implementation details, it can be cognitively useful at a more general level.

Let's review the important terms and their meaning in this context. Correct understanding is important as you move forward.

### Permissioned

There is no place for anonymous actors in enterprise networks entrusted with sensitive information. Anonymous, and likely unaccountable, users pose a security threat to networks, either by compromising confidentiality or by interfering in the correct operation of the system. If such users have no business being there, then they should probably not be there. Further, regulated enterprises are subject to strict security requirements, so anonymous users *must not* be there.

In Corda, there is a precise network admission process. An actor on a Corda network is represented by a node. Nodes are known to each other, and the system is designed to reject unauthorized nodes. Consequently, there is an expectation of accountability rather than anonymity.

Corda networks include nodes with specific roles. Chief among these are the Notaries. Notaries perform a special function in Corda's transaction finalisation process. A Corda network topology will generally include at least one node for each participating organisation as well as at least one Notary Service. The Notary (or Notaries) is conceived as a trustworthy neutral party and is implemented as a fault-tolerant service.

When working with public blockchain networks, network topology is a given. That is to say, public network topologies are the way they are and they are not open to revision by application architects. Consequently, application architects do not generally consider optimising network topology. That would be like contemplating redesigning the Internet instead of working with it as one finds it.

In contrast, when working with private networks like Corda, topology is indeed an axis of freedom, and aligning the topology with a set of goals is an important design consideration. Architects will define a topology that is acceptable to all participants. In other words, Corda network topology should not be taken for granted or assumed. Variation is possible and one should plan on carefully designing it.

### Distributed Ledger

Corda is often informally referred to as a blockchain technology owing to the many similarities, such as decentralisation, immutability, and security. Perhaps the main similarity is the end goal of a network of participants sharing a set of facts. Further similarities include the sharing of history about those facts, programmatic and strict control over allowable state transitions, a.k.a. “transactions.” Transactions update the facts. These properties are logically similar to what blockchains can do.

A blockchain is a particular data structure that together with a powerful consensus system can provide convincing transaction finality, immutability, and security. The same can be said of Corda, but Corda's implementation accomplishes it by other means. In Corda, there is no chain and there are no blocks, so there is clearly no chain of blocks. The term "Distributed Ledger" turns attention to the result of the design without implying a misleading description of the underlying implementation details. As you will see, the underlying process is unique to Corda.

### Enterprise Settings

Let us consider how enterprise requirements, including those of regulated enterprises, differ from the goals of public blockchains and how those differences influenced the design.

First, consider that no one knows who owns the nodes in a public blockchain which leads to questionable accountability. That is often unacceptable from a regulatory perspective where there may be strict requirements concerned with custody and accountability. Also, public blockchains generally rely on financial incentives and penalties, but even a very costly attack is financially feasible if the expected return exceeds the cost. Financial incentives provide insufficient security for the settings Corda is designed to address.

{{<ExpansionPanel title="How so?">}}

Imagine a classic _ERC-20 token_ on Ethereum, named DANGER. A unit of this token represents a share in the Dangerously-At-Risk company. The DANGER token has a valuation on the market of, say, &#36;1, and the company has, say, 10 billion shares. This places the market capitalisation of the company at 10 billion dollars.

Now, consider a transaction for 1% of the company, i.e. 100 million shares. This is worth 100 million dollars. The sender of this 1% is the attacker and is planning to revert the transaction after the off-chain consideration has been obtained.

Suppose it costs 10 million dollars per hour (hypothetical) to run a _51% attack_ on Ethereum. This means that if the attacker can complete the attack in less than 10 hours, it will cost less to attack the network than what is gained from reverting the 1% transfer.

And, the higher the attack value, the more cost-effective it will be to attack.

{{</ExpansionPanel>}}

Corda is also distinguished from other so-called "smart contract" platforms by its focus on familiar legal documents and the codification of existing business logic. Blockchain-based platforms such as Ethereum (public), Quorum, and the various Hyperledger projects (private) apply what might be described as a software-first approach. The universe is modeled as a state machine. These platforms are indeed novel environments for the creation of stateful application-level network protocols, but their designs bear little resemblance to legal contracts. Application designs often imply a significant departure from existing business processes or even new and novel business models.

Corda is different in that it focuses from the beginning on legal language, business processes, how disputed agreements are resolved, and the specific concerns of regulated enterprises. While some blockchain maximalists proclaim that "Code is Law," in Corda, Law is Law, and Corda applications are operational implementations.

### Execution Logic

Corda is not a virtual machine. Corda is purpose-built for recording, managing, and synchronizing facts shared by participants. CorDapps, which are the applications that can be built on Corda, closely model business processes that begin with the existence of binding agreements. In Corda, contracts implement legal agreements. Corda helps execute contracts by easily implementing business processes such as collecting the necessary approvals and signatures that will create, execute and transact binding agreements.

## What does Corda Solve?

In Corda, each organization maintains a ledger that records the firm's legal agreements and positions with counterparties. A great deal of inter-enterprise activity is concerned with reconciling divergent histories and facts. Inconsistencies are inevitable given the duplication of complex processes. This leads to further costly reconciliation and dispute resolution, which is itself error-prone and costly. Multiple views of the same transactions are a source of (potentially serious) risk.

Duplication could be eliminated by a centralized database, but this implies a host of adjacent challenges. Technology costs would fall, but who would run the system? Who would own it and what would happen if "the" system needed to be shut down temporarily for maintenance? What jurisdiction would host it and what would stop them from abusing control of the system? What if hackers gained access?

A distributed database is not a solution to this problem for the simple reason that all participants would have to trust each other completely. A distributed database is a suitable architecture to tackle such problems as availability and performance within an organization, but it is not a solution when the node operators don't trust each other fully.

In case this notion of partial trust is unclear, remember that Corda network participants will often be competitors who have decided to cooperate in the construction of a mutually-beneficial system. They are allies in their effort to increase the size of the pie and they are competitors when they divide the pie.

<!-- !(Trust-Boundaries) -->

Distributed ledger alters the trust boundaries.

There is an element of pre-existing trust because the organizations in the network know each other and have decided to form a Corda network. The pre-existing trust does not imply that the organizations will share details of their internal processes, and Corda doesn’t require that they do. Nor does this element of trust imply that any organization must blindly accept information from the network in deference to any consensus model.

Corda provides the network protocol for nodes to exchange messages about *possible* state transitions and each node verifies for itself if such a state transition is acceptable from a business point of view. Corda provides non-repudiation, meaning an inarguable history of the shared facts.

{{<ExpansionPanel title="Give me an example">}}

When company A purchases new desks from company B, the following steps may have to happen:

* At company A: department head asks for new desks for new recruits.
* A: procurement manager approves the request, which triggers...
* A: company A's Corda node to place a request for a quote to company B, which triggers...
* B: a salesperson at company B to pick up the request.
* B: the salesperson assembles a quote and sends it to the sales manager.
* B: sales manager approves the quote, which triggers...
* B: company B's Corda node to send the quote to company A, which triggers...
* A: the procurement manager to look at the quote and to, say, approve it, which triggers...
* Company A's Corda node to place the order to company B, which triggers...
* B: company B's Corda node to place an invoice to company A, and
* B: the production team to fulfill the order

You know the whole story because you read about it here, but in Corda, the only things:

* Company A knows about B are:
  * B received the request and sent a quote in response.
  * B received the order and sent an invoice in response.
  * presumably B is busy fulfilling the order.
* Company B knows about A are:
  * A sent a request.
  * A accepted the quote and sent an order in response.
  * A received the invoice.

This list is the inarguable history of the shared facts.

Behind the scenes, each company was free to implement their internal workflows as they saw fit and to accept or reject at any point. All that was required of each was to play along with the predefined messaging steps.

{{</ExpansionPanel>}}

### Balancing Concerns

Corda attempts to balance several concerns, optimizing for the enterprise. These concerns include:

- Privacy and confidentiality
- Scalability
- Security
- Complexity
- Other concerns

### Peer-to-Peer

According to R3, "On the grounds of confidentiality, we reject the notion that data should be broadcast to all participants or cumbersome pre-defined groups." Corda communications are peer-to-peer on a "need-to-know" basis without broadcast. Need-to-know is quite different from Ethereum's public broadcast, Quorum's private transactions, or Hyperledger Fabric's network "channels" approach. In a Corda network, if Alice transacts with Bob, then only Alice and Bob need to know about it, and possibly a regulator.

Corda nodes do not share an all-encompassing view of the world. Alice and Bob share a view of a specific transaction (and other details) that concerns them because they are parties to the transaction, but each has information the other doesn't have. Carol, who is not a party to the transaction receives no indication that the transaction even exists.

Physically, a Corda network is a fully connected graph, and all nodes can potentially send a message to any other node. A network map service informs nodes about the topology.

Corda networks are designed to scale. As you will see, the transaction finalization process is designed to run as fast as the network and underlying hardware will permit. The finalisation process isn't logically constrained by a pacing mechanism or the need to gather widespread agreement as is found in blockchain networks reaching for consensus. If Alice and Bob agree that the transaction is finalized and various processes finalize it, then it's final.

### Message Queues

The system uses AMQP (Advanced Message Queuing Protocol) over TLS (Transport Layer Security) which provides resilient routing and queuing even in the case that nodes are restarted. AMQP is asynchronous, performs well under load, provides guarantees about message delivery and persistence, and operates without assumptions about continuous connectivity. When recipients are offline, messages queue up and retry until delivered.

### UTXO

Corda uses an Unspent Transaction Output model, a.k.a. UTXO. This is conceptually similar to Bitcoin's approach. Each transaction consumes zero or more states that previously existed and outputs zero or more new states. As a very simple example, consider a simple IOU. Alice will borrow &#36;100 from Bob. The contract is the IOU agreement. Its purpose, in summary, is to describe the state of the loan, meaning who is in debt, to whom is that debt owed, the currency of the debt, the current balance, payment terms, deadlines, etc.

The transaction that produces this IOU contract will consume &#36;100 of Bob's money (the old state). Suppose Bob begins with &#36;1,000. In simplified form, the transaction will consume the old state (Bob no longer has exactly &#36;1,000 dollars), and produce three new states: Bob now has &#36;900, Alice has &#36;100, and there is a new loan contract in which Alice has agreed to repay &#36;100. Indeed, in proposing such an agreement, Alice is, in effect, proposing that this should be the new state.

Assuming this transaction is agreeable to both parties and finalized, then these new states exist, and the old states are consumed. Where and how the states are stored is covered later in this training. For now, the main point is that each state is unique and therefore has a unique hash. The transaction consumed states that can only be consumed once. This model makes it easy to analyse static snapshots of the data and reason about the contents of everything in flight. Importantly, it is possible to apply transactions in parallel.

Mis-ordering of transactions is impossible since each transaction depends on the existence of states that came before and which can only be consumed one time. This structure neatly addresses the double-spending problem while putting minimal demands on the consensus process. All that is required is a reliable history of states that exist and a reliable method of extinguishing them.

### Transactions are Proposed State Changes

Unlike deterministic platforms that rely on each participant having a copy of the contract software and verifying the correct execution of deterministic contract functions, Corda transactions are largely silent on the precise details of *how* the agreed outcome is achieved. Further, it is not important and generally not recommended that each party to a Corda contract should divulge their in-house proprietary logic and process. Transactions are proposed as hypothetical state changes but they are silent on exactly how each party approves or disapproves proposals and how they will comply with the terms of the contracts.

In case this isn't clear, let's return to the simple IOU. This will help illustrate the processes and the meaning of important terms.

Consider a blank loan application. There is no lender, borrower, or amount yet, but the form of the agreement is essentially defined as boilerplate. When Alice completes the application, a certain amount of validation can unfold immediately. This would confirm that the application is complete and valid. Submitting the loan application is a proposal to change the state of the ledger. Alice’s state transition proposal will reference the IOU template (think `.class`) which will verify that Alice’s proposed IOU contract would be valid.

In simplified terms, Alice may sign a proposal to amend the ledger such that &#36;100 would appear in her account and, simultaneously, an IOU contract she proposes would also exist. Her proposal describes the effect of the trade she wishes to commence with Bob.

This proposal is sent directly to Bob. Bob may reject it, and Bob is not required to reveal details of his decision-making process. If he wants to accept the proposal, he signs the transaction. Being the last required signature, that results in a credit of &#36;100 in Alice's account (and less in Bob's account) and a record of a new IOU. Bob will, of course, attend to in-house accounting that will include finding a source of funds but this is not Alice's concern. Bob is required to find &#36;100 but the IOU, and Alice, are unconcerned with the source. So, the contract is silent on that detail.

The transaction is finalized when the conditions are met and the required signatures are collected. Finalisation consumes old states and produces new states. As you will see in more detail later in the course, a _Notary_ ensures that states can only be consumed once, and this prevents double-spending.

Alice will service the IOU through a series of transactions that will propose further amendments to various states. For example, she will propose installments that consume Alice's funds and also update the outstanding balance of the IOU. Bob will not accept such proposals without first confirming for himself that Alice's proposal complies with the terms of the contract. For example, if Alice proposed that the IOU should be extinguished for no money, there may be nothing in the contract that prevents her from making this proposal. Under normal circumstances, Bob would reject such a proposal. In Corda, the choice is up to Bob. In abnormal circumstances, for instance, in the case of Alice's bankruptcy, Bob might be ordered by a court to accept extinguishing the IOU for no money. State-change proposals are fundamentally different from platforms in which edge cases must be anticipated in advance and codified in immutable logic so that contracts can determine the result of every input.

Corda’s process maps well to our understanding of established business processes. Alice proposes that she will agree to the terms of an IOU if Bob provides matching funds. As the IOU is repaid, Alice offers funds contingent on Bob agreeing to apply the funds to the IOU. For example, Alice offers cash to Bob on the condition that Bob agrees to a reduction of the IOU balance. In this context, a transaction can be understood as an evolution of one or more states that is agreeable and signed off by all interested parties.

### Re-use / Build

Corda uses existing banking industry-standard bank-friendly libraries and avoids "reinventing the wheel."

<!-- Dan Would say “is being” although maybe that's true as part of 4.4
would need to check with Chris whether DJVM is “live” or not -->

The JVM can be (and has been) modified to be deterministic. After whitelisting a small subset of classes/methods, the JVM attack surface is greatly reduced. Contract developers have access to the huge Java ecosystem.

Persistence is provided by SQL databases that are universally familiar, and this can ease integration with other in-house systems. Indeed, any SQL database can be used if it supports JDBC connectivity.

### Flexibility

As well as supporting different databases, Corda has no fixed consensus system. Notaries provide a reliable witness that is instrumental in ensuring that states can only be consumed once, thus preventing race conditions that can lead to double-spending. Notaries themselves can use different algorithms, and Notaries of different types can co-exist on a single Corda network. Therefore, on Corda networks, the transaction validation and finalisation process details may vary somewhat for different types of transactions.

<!--
## Corda in comparison with Ethereum and Hyperledger

**suggestion to add a paragraph about the differences. Found this articles:**
https://medium.com/@philippsandner/comparison-of-ethereum-hyperledger-fabric-and-corda-21c1bb9442f6
https://medium.com/@micobo/technical-difference-between-ethereum-hyperledger-fabric-and-r3-corda-5a58d0a6e347
https://blockchain-fabric.blogspot.com/2018/03/qualitative-comparison-of-hyperledger.html

**plus, I would add a comparison table. See the example in the image folder (this branch)**
-->

## Differentiating Corda, Blockchains, "Contracts" and "Smart Contracts"

Blockchain network designs guide participating nodes toward consensus about the state of the entire network or sub-networks (channels in Hyperledger and distribution lists implemented with `privateFor` in Quorum). By extension, such consensus implies consensus about the state of a virtual machine. Corda does not aim for consensus about the overall world state. Instead, Corda aims for consensus between two or more parties to an agreement. The consensus sought is concerned only with the state of that agreement and it is achieved one deal at a time. While blockchains serialize transactions into a consensus order of events, Corda does not require a globally ordered transition log. Unrelated state transitions are finalized in parallel.

The term "smart contracts" as it applies to the blockchain space conjures up misleading assumptions about their true nature. They are not "smart" in the sense of subjective judgment. It is quite the opposite. They are mechanistic and deterministic and therefore, in theory, they are completely predictable. They describe application-level, stateful protocols with little resemblance to legal agreements. Thus, they are less like legal "contracts" and more like reliable, stateful, software-defined protocols.

In stark contrast, Corda "contracts" are conceived as representations of actual legal agreements and the definitions of actual assets. That may seem like a dual purpose, but it's actually singular. Consider that one person's debt is another person's asset and even fiat currency is a debt-based instrument. Corda contracts give form and effect to data that represents agreements and thus define assets.

Blockchain transactions are signed inputs that are executed according to the rules of the protocol and may include the interpretation and execution of steps defined in a smart contract. The final state of the ledger, inclusive of any smart contracts involved, is the only correct interpretation of the input. Such rigid determinism implies that great care must be taken to anticipate every possible edge case and codify processes for dealing with them. These processes are disclosed in smart contract code that is open to inspection so the parties can see the rules of the system.

Corda approaches transactions in approximately opposite fashion. Transactions propose new states while remaining largely silent on the process. Recall the IOU example where Alice *proposes* a new state in which an IOU exists *and* &#36;100 is added to her account. This description is silent on Bob's source of funds but makes it clear that Bob will have to provide &#36;100 from somewhere. Bob is under no obligation to accept Alice's proposal and his approval process (which would presumably include an evaluation of Alice's credit-worthiness) is not disclosed to Alice. Nor does anyone (except Alice) necessarily know why Alice wants the loan or what she does with the money. Neither party gains access to the internal business processes of the other. This is important because it safeguards the intellectual property of network participants who are also competitors.

Transactions are proposals to consume zero or more input states and produce zero or more output states, where states reference the contracts that give them meaning. Notaries witness such transactions and ensure that states are never consumed more than once. This prevents double-spending while permitting parallelism because the double-spend protection doesn't rely on a consensus about the global transaction order. Information about shared states is shared, on a need-to-know basis only, with participating parties to a given contract and observers such as regulators and Notaries.

## Summary

In this training, the term "contracts" describes contracts in Corda and the term "smart contracts" describes the blockchain approach (usually for comparison or historical purposes) because conflating the two designs can be a source of considerable confusion. The main similarity is in name only. Closer inspection reveals properties that are quite dissimilar.

Corda is similar to blockchain platforms in that it enables a group of participants to form a network with strong assurances about a shared set of facts. It does so without reliance on a chain of transaction blocks. Corda balances various concerns such as transaction finality, confidentiality, availability, and performance and it provides flexibility at the level of the consensus mechanism applied to individual transactions.

In Corda, contracts are modeled after traditional legal contracts. Parties rely ultimately on courts of law rather than consensus mechanisms. The network is concerned with the shared states of agreements, their histories, and with choreographing the workflows of the parties involved.

## Further Reading

This is optional.

- [R3 Customers](https://www.r3.com/customers/)
- [Comparison of Ethereum, Hyperledger Fabric, and Corda](https://medium.com/@philippsandner/comparison-of-ethereum-hyperledger-fabric-and-corda-21c1bb9442f6)
- [Technical Difference Between Ethereum, Hyperledger Fabric, and R3 Corda](https://medium.com/@micobo/technical-difference-between-ethereum-hyperledger-fabric-and-r3-corda-5a58d0a6e347)
- [How Corda got its name](https://medium.com/corda/the-story-of-how-corda-got-its-name-d27d93962606)
