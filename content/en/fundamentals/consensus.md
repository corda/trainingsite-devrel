---
title: Consensus
description: Purpose and types
slug: consensus
menu:
  main:
    parent: fundamentals
    weight: 50  
weight: 50
---

In this section, you will discover what it takes to achieve consensus across a distributed network, and the various proofs that have been established in different blockchain technologies.

You will explore:

- The basics of distributed consensus.
- Proof-of-Work.
- Proof-of-Stake.
- Delegated-Proof-of-Stake.
- Proof-of-Burn.
- Proof-of-Importance.
- Practical Byzantine Fault Tolerance (PBFT).
- Proof-of-Activity (PoA)
- Proof-of-Capacity (PoC)
- Proof-of-elapsed-time (PoET)

These topics are rich in conceptual detail, and become more important as you grow to understand more about blockchain and distributed ledger concepts.

## Distributed Consensus

In a distributed network without authorities, participants need a process to reach consensus about what is to be considered as the truth; this is referred to as distributed consensus. An identified problem in distributed computing, which is provably unsolvable but can nonetheless be mitigated, is how to reach consensus in a hierarchy-free, permission-less and failure-prone network.

This problem is commonly known as the Byzantine generals' problem. Mitigation strategies are known as Byzantine fault tolerance. In the traditional description of the problem, generals, whose armies are spread around a target city, need to reach consensus on a time to attack. To achieve this, they can only rely on unsecured communication channels, whereby, for instance, a lack of acknowledgement can either be caused by a failure to deliver a message, by a dead general or by a failure to deliver the acknowledgment or even messengers and generals who are traitors and deliberately distort messages.

The problem is often framed as a binary decision to simultaneously attack or retreat, with uncoordinated action often framed as a catastrophic outcome, but more nuanced possibilities exist.

![Generals exchanging messages](/fundamentals/generals.png)

Many configurations of the problem are possible, for instance, postulating different numbers of generals involved, degrees of reliability of the messengers, range of decisions possible, and so forth. Approaches to solving the problem are often described in terms of fault-tolerance thresholds - how many loyal generals and clear messages are required for the group to reach the correct overall decision?

The "problematic" decision a distributed ledger needs to make is to establish the agreed list, and correct order, of transactions. Indeed, as this technology is distributed, individual transactions are sent to the network from individual nodes. These nodes then pass, or fail to pass, transactions to other nodes. Because of physical latencies, not all nodes see the same transactions at the same time, so each node builds its own order of transactions. All nodes being equal citizens, there is, as such, no authoritative order of transactions; although a decision has to be made as to which node's version, or any version, of the truth shall be the authoritative truth.

One of the innovations introduced by Bitcoin in addition to the chain of blocks was to use proof-of-work to obtain consensus. Since then many other consensus algorithms for new blocks were proposed. One should note that there were consensus algorithms presented in the academic community before Bitcoin. Let us look at some of the most popular consensus algorithms.

## Proof-of-Work

![Proof of work as mining](/fundamentals/pow.png)

A user completes a task of arbitrary difficulty. This is generally implemented as a search for a random number which when combined with ordered transactions in a block yields a hash function result that matches a criteria such as minimum number of leading zeroes. Finding such a solution is taken as evidence of considerable effort (or proof that considerable work *must* have been invested) in the search.

<!-- TODO Proof of Work https://www.youtube.com/watch?v=iCYj6BfxxJE -->

Nodes in the network conduct their searches independently. The successful node that announces a solution first receives an economic reward that encourages participation in the process. The idea of substantiating a claim through an arbitrary amount of work was previously suggested as a way to combat spam in other contexts.

If a node wishes to distort the ledger in a PoW system, it must first acquire an authoritative position, otherwise it will be unable to influence the ledger. Acquiring an authoritative position implies overcoming the *combined* problem-solving capacity of the network and maintaining that lead over time. This known attack vector is called the 51% attack. As the name suggests, if a single party acquires more than 50% of the total problem-solving capacity of the network, that party is theoretically able to alter the consensus.

The control mechanism for the amount of work is called "difficulty" and it guarantees a given average block creation time. PoW networks set a target average time for a solution to be found by *any* node on the network. Difficulty adjusts to compensate for increasing / decreasing total network problem-solving capacity. Thus, PoW networks do not get faster as more compute capacity is added. They become more resilient by increasing difficulty, which raises the threshold a 51% attacker will need to overcome.

## Proof-of-Stake

<!-- ![](images/pos.png) -->

Proof-of-Stake (PoS) is another method of selecting the authoritative node for a given block. PoS is based on the assumption that those with the most to lose are the most incentivized to safeguard network integrity.

A successful Proof-of-Stake system must address the problem of "nothing at stake." That is, randomly-selected validators must face a disincentive for bad behavior as well as a high probability that bad behavior will be detected. The burden of detection usually falls on the rest of the network that can either accept or reject the validator's opinion. A solution to the disincentive aspect is to extract a penalty for emitting opinions that are ultimately rejected by the network.

Validators place funds at risk (the stake). For any given block, a validator is selected in pseudo-random fashion with preference to validators with the largest stake. While PoS systems generally do not reward validators with new coins, validators receive transaction fees in return for generating blocks the rest of the network accepts. Validators face economic penalties in the case that they generate blocks that are rejected by sizable numbers of the other nodes.

A validator is thus incentivized to generate blocks that are likely to be accepted by the network and faces financial punishment in the case that it fails to do so.

The planned PoS protocol for Ethereum is called “CASPER”. PoS is already used in Nxt. PoS solves the energy-consumption problem of PoW (due to its work-heavy process) and is often faster than PoW's steady block times because it doesn't rely on difficulty itself.

## Delegated-Proof-of-Stake

![Delegated proof of stake](/fundamentals/delegated-proof-of-stake.png)

An extension of proof-of-stake algorithms is called delegated-proof-of-stake (DPoS). It is, for example, employed in Bitshares. In this type of consensus mechanism, there are so-called witnesses, which are elected by the stakeholders of the network. Several witnesses are chosen for block creation in such a manner that they represent at least 50% of the stakeholders’ votes.

## Proof-of-Burn

<!--  ![](images/pob.png) -->

The term “burn” in this context refers to the mechanism of sending coins to a “burn” address, which are so called because the block creators believe nobody knows the private key. The coins on the “burn” address cannot be spent due to the absence of a private key. Money that cannot be spent is approximately the same as destroyed, or burned.

To be considered for block creation one can participate in a lottery and will get rewarded by it, when chosen. Because of the coins’ worth, the same underlying philosophy as in the case of proof-of-work is utilized, but furthermore the energy problem and the “nothing at stake problem” are solved.

## Proof-of-Importance

<!--  ![](images/poi.png) -->

The idea here is to solve the “rich man gets richer” problem, which arises in PoS algorithms. For this reason, the protocol rewards activity in the network based on the so-called importance score, which is calculated using graph theory. This calculation includes the transactions to and from an address. The probability of being chosen to build new blocks increases with the value of the importance score. Proof-of-importance (PoI) is implemented in NEM.

## Practical Byzantine Fault Tolerance (PBFT)

PBFT was published in 1999 and arose from academia. It is a three-phase protocol in which the client sends a request to a so called primary. In the first phase, the primary broadcasts to the replicas. Then, the replicas agree that it is properly signed, properly formed, and otherwise acceptable. When a threshold of required endorsements is achieved, the message is verified and replicas agree on the overall order of endorsed transactions within a view. This canonical transaction order is forwarded to clients. This of course is very simplified. You can access the paper by Miguel Castro and Barabara Liskov [here](http://pmg.csail.mit.edu/papers/osdi99.pdf). But there is also a very understandable [presentation](http://www.comp.nus.edu.sg/~rahul/allfiles/cs6234-16-pbft.pdf).

## Proof-of-Activity (PoA)

PoA is a combination of PoW and PoS. The miner creates a template with the nonce and deploys it to the network. Then the signers are chosen by the block hash of this template. If the template is signed by the signers, it becomes a block. In the end, the reward is shared between the miner and signers.

## Proof-of-Capacity (PoC)

<!--  ![](images/poc.png) -->

PoC uses the memory or HDD of a user to reach consensus. It creates hashes and stores these. Then it selects parts of the data, taking into account the last block header in the blockchain. The selected data is hashed and must fulfill a given difficulty. PoC is utilized in order to be fairer, because memory access times do not vary as much as CPU power.

## Proof-of-elapsed-time (PoET)

<!--  ![](images/poet.png) -->

PoET elects a leader via a lottery algorithm. The key point is the lottery must be performed in a trusted execution environment (TEE). For this purpose, Intel offers Software Guard Extensions (SGX). The lottery provides every validator with a randomized wait time. The validator with the shortest time becomes the leader. The leader is eligible to create a block after the allotted time. The underlying idea is the same as Bitcoin in that the first node to announce a valid block wins. Rather than compute-intensive proof-of-work, the tamper-resistant TEE is relied upon for randomness/fairness. PoET is used in Intel’s Hyperledger Sawtooth Lake project. The new block must be accepted (BFT) by the rest of the network.

## Further Reading

- [Proof of Authority: consensus model with Identity at Stake](https://medium.com/oracles-network/proof-of-authority-consensus-model-with-identity-at-stake-d5bd15463256)
- [Tendermint](http://tendermint.com/docs/tendermint.pdf) is a decentralized consensus engine that runs its own public blockchain and also supports decentralized computing. It differs from Ethereum on its consensus protocol, which uses the concept of validators who need to bind funds to validate and who validate blocks over the course of a certain number of rounds.
- [Counterparty](http://counterparty.io/platform/) aims to extend the Bitcoin blockchain and allows for a limited degree of smart contract execution. They also created their initial coins in an innovative way, by [_proof-of-burn_](http://counterparty.io/news/why-proof-of-burn/) of Bitcoins.
- [Stellar](https://www.stellar.org/developers/learn/get-started) was originally forked from Ripple, has now completely diverged from it, and introduced what they called a "Federated Byzantine Agreement", whereby consensus is reached by quorum slices.
