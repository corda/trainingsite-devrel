---
title: Key Concepts
description: Components and structure of a CorDapp
slug: concepts
menu:
  main:
    parent: corda-fundamentals
    weight: 20
weight: 20
---




Now that you have a conceptual understanding of what the Corda platform *is* - it's time to learn about the components that make it *work*.

You will be introduced to:
- Corda as a network of interconnected graphs.
- Nodes.
- States.
- Bilateral ledger.
- Transactions.
- Contracts.
- Commands.
- Timestamps.
- Attachments.
- Flows.
- Consensus.
- Notary services.
- Oracles.
- CorDapps.
- Node services.
- Corda networks.

In the following modules, you will learn how to use and work with these concepts. They are essential to understanding how to become a developer or operator using Corda. Use this section as a reference point if you get stuck at any point in the future modules.

## Corda Network

Corda networks are fully connected graphs with connectivity from every peer to every other peer. There is no global broadcast or gossip. Peers communicate reliably, asynchronously, and securely using AMQP over TLS (think SMTP). A Network Map service publishes a list of peers (think directory service).

## Nodes

A node is a piece of software that:

* participates in a Corda system or network,
* and runs Cordapps.

## States

The aggregate of all states held by all nodes of the network is the distributed ledger state. There is no central ledger, and not all nodes know all states, so the overall ledger is subjective from the perspective of each participant. Most states are found in&nbsp;/ on at least two different nodes.

![Corda Ledger](/corda-fundamentals/corda-ledger.png)

### Bilateral ledger

Each node maintains its own *vault* of states. In this example, Alice and Bob both have copies of their shared states as well as states that are known only to themselves.

![Bi-lateral Ledger](/corda-fundamentals/anatomy-bilateral-ledger.png)

As mentioned previously, states are nodes of a UTXO (Unspent Transaction Output) DAG (Directed Acyclic Graph). Only the "unspent" states define the current state of the world. The "spent" states are part of the history of the world state. States are unique and can only be spent, or consumed, once.

States define data that will be explored in more detail in upcoming sections.

Cash is an example of a state. "Alice has &#36;10" is a state. If Alice spends &#36;1 in a transaction, then the original state ("Alice has &#36;10") is replaced by a new state ("Alice has &#36;9") plus another state because someone else, let's say, Bob has the other dollar. Only slightly more formally, the other state is "Bob has &#36;1".

To help you get accustomed to the Corda way of describing these state transitions, let us recap Alice sending Bob &#36;1.

- **Old State:** Alice has &#36;10 (consumed)
- **New States:** Alice has &#36;9 and Bob has &#36;1 (created)

## Transactions

Transactions are what consume states and produce new states. They are atomic. Transactions either complete entirely or have no effect. There are no partially complete, "in-flight" transactions although they do have a lifecycle with various stages.

A transaction in Corda is not like in SQL or Ethereum where a command and parameters are passed along, and the state machine "decides" what is the new state.

Instead, a transaction references existing input states and future output states. A transaction that is not yet accepted by the parties is called a proposed transaction.

Let’s return to the cash example. Suppose Alice will send all &#36;10 to Bob. A transaction can reference an input state "Alice has &#36;10," and an output state "Bob has &#36;10". The transaction consumed "Alice has &#36;10" so that becomes a historical state. It is part of the past and it explains the history of Alice's account. It is gone because Alice sent it to Bob. The layman's description of the transaction is that cash has changed hands.

<!-- TODO Reinstate when it is redone with R3 colors ![Transaction animation](/corda-fundamentals/utxo_transaction.gif) -->

![Static version of transaction](/corda-fundamentals/utxo_transaction.png)

## Contracts

Contracts in Corda do not describe how states are created but they do define certain properties. These properties constrain the state transitions that will be allowed, like a checklist. In this way, they can validate proposed state transitions.

In effect, one or more parties of a transaction propose a new state of the world, and the contract agrees with this new state, or not. Contracts also mention Legal Prose that, in case of a dispute, would presumably be accepted in a court of law. States reference contracts. In effect, states mention the code that will allow or prevent their creation and consumption.

![Contracts acquiesce or not on a state transition](/corda-fundamentals/contract_acquiesce.png)

For the cash example, the contract could enforce conservation of funds by ensuring that the cash amount of the input is the same as that of the output. So, you could not have a transaction that had as input "Alice has &#36;10" and as output "Bob has &#36;9". A simple cash contract would enforce a conservation rule stating that the sum of the inputs must equal the sum of the outputs. Such a structure is sufficiently flexible to apply the rule to more complex situations. A transaction could, for example, propose to take &#36;100 from Alice, &#36;200 from Bob and then give &#36;150 each to Carol and Dave. The contract would ensure that all the cash inputs equal all the cash outputs.

Notice that the cash contract is silent on the reason for the transaction. The cash contract is unconcerned with the reason for spending. It is concerned with accounting and ensuring that cash can't be created or destroyed (the issuance concern is set aside for simplicity). Contract rules define the assets that are mentioned in states such as "Bob has &#36;10."

With states, transactions, and contracts, Corda has the basic elements of data and transitions.

## Commands

You've seen how contracts lay out rules about allowable state transitions and transactions propose state transitions. You have seen that the necessary signatures are collected to prepare to finalize a transaction that will consume the input states and create new output states. You could say that the purpose of a transaction is *implied*.

In case this isn't clear, consider that Alice proposes to adjust her IOU down by &#36;10 while giving &#36;10 to Bob. *Implicitly* she is offering to make a payment and she is informing Bob about her opinion of what that means. State transition proposals are technically sufficient to model transactions, but it becomes confusing as complexity and the variety of possible transaction types increases. What if Bob has difficulty understanding Alice's intent?

For practicality in more complex settings, the Corda team created the concept of commands. Commands are part of a transaction and give them intent. Intent helps guide interpretation.

Using the cash example, if "Alice creates &#36;10" out of thin air (let us suppose she is entitled to), you would call this "minting" or "issuance." If you consumed this state and output "Bob has &#36;10", you would call this "paying" or "moving." If you had no output state, you would call this "burning", "retiring" or "redeeming."

Commands signal the intention of a proposed state transition which helps the receiver classify received transactions and move on to considering the proposal. Smart contracts too, can branch their verification logic based on the command. More precisely, commands parameterize transactions by hinting at their intent, collecting the inputs, and specifying the list of required signers (by their public keys).

![A Swap Command](/corda-fundamentals/command.png)

## Timestamps

In Corda, Timestamps assert that something happened within a specified window. These windows can be open or closed.

For example:

- Between the earliest time and the latest time.
- Before the deadline time.
- After the commencement time.

Never:

- At the exact time.

Time ranges map to our understanding of real-world business processes and Legal Prose that is (presumably) enforceable in law courts. For example, an offer open to acceptance before a certain deadline becomes invalid quite naturally as the overseeing verification rules disregard acceptance if it arrives after the deadline.

## Attachments

Corda transactions may include attachments that are included with the transaction but are not part of the transaction itself. These are `.ZIP` or `.JAR` files attached to the transactions.

Attachments can include:

- Legal Prose with the template and parameters
- Data files that support transactions such as calendars, currency definitions, or even financial data
- Contract code and associated state definitions (`.class` files) that define the transaction states mentioned

## Flows

Flows model the business processes that oversee the evolution of transactions states. Consider the simple example of Alice's IOU. Alice first proposes the IOU which includes reference to the IOU contract that informs the contract state to be created, as well as a proposal that Bob will credit Alice's account with some currency. There is a process of gathering approvals before this proposed transaction is final.

First Alice will sign. Then Bob will sign. That's a simple flow. Still, the flow needs to add the proper command, and the proper list of required signers to the transaction, so that the smart contract(s), which invariably verify the presence of the relevant signers, approve the transaction.

Flows can be created in order to be widely reused or created ad hoc. Nothing prevents Bob from agreeing on and preparing a different flow in order to issue an IOU to Carol. In the case that Alice defaults, or a court of law orders the parties to agree on an unforeseen transaction, a flow made for the situation can be created then and there, as long as the contracts allow the proposed state changes.

Flows can be more complex and can include more than two parties. For example, if regulatory oversight is required, then the flow would indicate a third step to inform the regulator. Separately, if the flow is started from Alice's side, she would first have to ask Bob to find and aggregate enough cash states before proceeding to sign a transaction.

When thinking about flows, it might be helpful to consider more complex and well-known transactions such as transferring ownership of an asset like a house or vehicle. Such transactions usually begin with 1) an offer, and 2) acceptance. They conclude with a finalized transaction that results in a state transition, called completion in some contexts.

Such transactions involve the buyer and seller, obviously, but completion also involves participating lenders, escrow agents, insurance companies, and registries. Much of what happens involves gathering the necessary assurances at each step before proceeding to the next step. Finalising, or executing the transaction involves the actual transfer of ownership, the exchange of funds, notifying the registry, and so on. Both the buyer and seller should want the transaction to complete entirely or not at all because cases where the asset and the funds are not exchanged simultaneously invariably lead to disputes.

Flows are light-weight processes that coordinate multi-step business processes that help peers reach consensus about shared states&nbsp;- their mutual understanding of what happened.

![Example of simple flow](/corda-fundamentals/simple-flow.png)

In computer science terms, flows are continuations. They are instantiated objects that encapsulate a discrete chunk of a whole process. The swim-lane diagram above describes the sequence of steps necessary to go from the state where there are $$n$$ IOUs between Alice and Bob to the state where there are $$(n + 1)$$ IOUs between them. Two or more _small_ flows can be composed together to make a _large_ flow that represents a process larger than any of its components. As instantiated objects, flows can be passed around as arguments. Just like building blocks are small objects that can be composed to build a larger object, flows are instantiated objects that can be composed to build a larger process. This larger process can then be _launched_ at an opportune time.

In fact, in the same diagram above, the following pairs of steps are small flows in their own right:

* "Could you send me $10?" and "Yes, here are their references".
* "Care to sign?" and "Here is my signature".
* "Notary, please finalize" and "Ok, here is the notary signature".
* "Here is my IOU" and silent reception and recording.

Belaboring the point, if the following term is preferred in your vocabulary, a flow is a co-routine. A co-routine is a function that can be suspended and resumed at arbitrary points throughout its execution.

## Consensus

Consensus is the process by which all parties achieve certainty about the shared states. Corda applies two types of consensus:

### Validation Consensus

Validation consensus is when all peers achieve certainty that a transaction is signed by all peers listed in the commands and satisfies all constraints defined by the contracts referred to by the input and output states. To say that another way, it *can be* done, and everyone agrees it *should be* done.

![Transaction Validation](/corda-fundamentals/transaction-verification-flow.png)

### Uniqueness Consensus

Uniqueness consensus is when peers reach certainty that the output states generated by a transaction are the *unique successors* to the input states referenced by said transaction. This is how Corda prevents double spending.

Suppose Alice has &#36;10. More precisely, suppose Alice has a checking account contract with the Bank, and the current unspent state of the contract says Alice has &#36;10. When Alice spends &#36;1 this transaction will consume the existing state of Alice's checking account and generate a new one that indicates Alice has &#36;9. There would, of course, be other related details such as what happened to the dollar she spent. That concern is set aside to keep the focus on Alice's balance.

Suppose Alice was able to reference the input state of &#36;10 again. Alice would be able to spend more money than she has. But, the original state has a successor state that indicates that Alice has &#36;9. The &#36;9 state is a successor to the historical &#36;10 state in the history of Alice's account. The rule is that a state can only be consumed one time. Or, said another way, that the output states created are the unique successors of the input states.

Notaries help confirm uniqueness.

## Notary Services

Notaries are comparable to traditional Notary Public services that provide reliable witness to events. In simple terms, Notaries maintain a key map of input states and the transactions that consumed them. They need not know the content of states and transactions; they only need a reliable way to uniquely identify them.

In Corda, every transaction is Notarized along with the peer that requested Notarisation and the transaction that marked the input state as historic.

In the simplest implementation, the Notary Service is implemented as a fault-tolerant service and all the peers will use the same Notary for every transaction.

When a peer sends a transaction to the Notary Service, one of two things will happen. If any of the input states are already referenced in the Notary's map, then the Notary will throw an exception. If none of the input states are known to have been previously consumed, then the Notary adds each input state to the map and signs the proposed transaction. This process provides uniqueness consensus.

Together with verification consensus, uniqueness consensus provides certainty about transaction finality to all parties to the transaction.

To protect themselves against a potential DoS attack, whereby an attacker submits bogus transactions, a notary can be made to _verify_ transactions. In this case, the notary will act as a regular node, and accept the transaction only if its smart contracts approve. This possibility implies that the Notary will gather more information than a map of state keys that have been consumed and this hints at reasons why a Corda network may need more than one Notary. There is a trade-off between contract-level validation at the Notary level and data-leakage.

![Notaries and Historic States](/corda-fundamentals/notaries-historic-states.png)

## Oracles

Oracles provide authoritative information about the external world. For example, consider a currency swap. We'll say Alice wishes to trade with Bob 15 Euros for 18 Dollars. Is that fair?

The parties can agree to use a third party quote to establish a rate of exchange. This third party is known as an Oracle. The Oracle would provide the rate of exchange to Alice, then Alice would use the "swap" command to parameterize a transaction proposing that she sends 15 Euros to Bob, Bob sends 18 Dollars to Alice, *and* the current rate is 1:1.2. Alice, Bob *and the Oracle* are listed as required signers in the swap command.

In effect, the oracle, through its signature, vouches for the information that is included in the transaction. It may also provide valid information on demand, such that a node has an easier time building a transaction that the oracle will approve. Additionally, with a goal of additional privacy, it is possible, via the use of a Merkle tree and of a Merkle proof, to send only the minimum required information to the oracle. In Corda, this is referred to as a "transaction tear-off."

![Currency swap flow](/corda-fundamentals/currency_swap_flow.png)

## Corda Node and CorDapps

Corda nodes implement a number of services needed to participate in a Corda Network.

### CorDapps

CorDapps are the distributed applications built on Corda. Notice that these are implemented as extensions to the Node. The Corda Node is constructed in Kotlin and the source code of the node is open to inspection and extension. Kotlin itself is based on Java. CorDapps can be coded in Java or Kotlin.

CorDapps consist of Contracts, State definitions, Flows, and Services.

### Node Services

Clients connect to the Node via RPC. CorDapps connect via a service interface. The Node includes a messaging service for connecting with other Peers as well as Storage, Identity, and the Vault. The Vault is the storage repository where the node records states as key/value pairs. Below all this is the persistence layer, which is a SQL database.

[![A Corda Node](/corda-fundamentals/node-architecture.png)](https://docs.corda.net/docs/corda-os/4.3/corda-fundamentals-node.html#node-architecture)

### Corda Network

A Corda network is a fully connected graph. As well as two or more peer participants there are important special roles that form a complete implementation.

- One doorman which provides permissioning and certificate signing for the permissioned network
- Zero or more Oracles
- One network Map Service
- One or more Notary Services

![A Corda Network](/corda-fundamentals/corda-network.png)

## Summary

A Corda ledger is a set of facts shared unevenly between network peers on a need-to-know basis. The system consists of uniquely identifiable states that are constrained by verification rules in contracts. Transactions consume zero or more states and produce zero or more new states. Transactions can include attachments such as Legal Prose, class definitions and external data. Flows help multiple parties coordinate the lifecycle of transactions, meaning the evolution of the input and output states and the collection of signatures. Peers reach certainty about shared states via two types of consensus, verification consensus, and uniqueness consensus. Contracts provide verification consensus, and the Notary Service(s) provide uniqueness consensus. CorDapps are extensions of the base Corda Node, which provides services for participating in a Corda Network.

{{<ExpansionPanel title="Optional reading list">}}

- [Corda Introductory Whitepaper](https://docs.corda.net/_static/corda-introductory-whitepaper.pdf).
- [Corda Technical Whitepaper](https://docs.corda.net/_static/corda-technical-whitepaper.pdf).
- [Kotlin, a massive leap forward](https://proandroiddev.com/kotlin-a-massive-leap-forward-78251531f616).
- [Continuations](https://en.wikipedia.org/wiki/Continuation) on Wikipedia.
- [An essay on Javascript and continuation style programming](https://2ality.com/2012/06/continuation-passing-style.html).

{{</ExpansionPanel>}}