---
title: Contract example solution
description: An example contract solution
slug: solution-contract
menu:
  main:
    parent: first-code
    weight: 40
weight: 40
---


In the previous chapter, you saw an example solution of the `TokenState`. In this chapter, you will have a look at an example solution of `TokenContract`.

As always, there is no single truth as to implementation, but the hope is that you will reflect on your first attempt given the remarks therein. Let's go.

When linking to the code, this document will link to Java code, but you will also find the Kotlin implementation nearby and notice it is often more succinct.

You will notice that, as much as possible, variables are marked `final` and `private`, and annotated as `@NotNull`, lists are made immutable, and so on. The goal here is to introduce strictness and let the compiler warn as early as possible when the developer doing something untoward.

Find the `TokenContract` code [in Java](https://github.com/corda/corda-training-code/blob/master/020-first-token/contracts/src/main/java/com/template/contracts/TokenContract.java) and [Kotlin](https://github.com/corda/corda-training-code/blob/master/020-first-token/contracts/src/main/kotlin/com/template/contracts/TokenContractK.kt).

{{<HighlightBox type="warn">}}

Ok, fasten your seat belts. This class is important. You see, this is here that you ensure that no funny business takes place on your Corda distributed ledger. This cannot be over-stressed.

{{</HighlightBox>}}

First, before the below discussion, let's see a diagram that sums up the expectations of the contract and the state machine:

![CDL view of contract and state machine](/first-code/cdl_tokenstate_machine_view.png)

## The class declaration

```java
public final class TokenContract implements Contract {
    public static final String TOKEN_CONTRACT_ID = "com.template.contracts.TokenContract";
```
If you want your `TokenContract ` to be used as contract in Corda, it has to implement `Contract `, so that's a given.

The class was made `final`, not because it has to be, but because:

* You need to make a conscious decision as to whether you want to extend it, or let it be extended. So remove `final` if that is the case.
* Kotlin makes classes `final` by default, and this behavior is copied here.

The `TOKEN_CONTRACT_ID` string will be used by the transaction builder to identify which contract to attach to a state by way of pseudo-reference. In fact, it is also cross-checked with the `@BelongsToContract` annotation on the state. Unlike a state, a contract is stateless and not serialized, nor is it transmitted over the wire to the relevant peers. Instead, any contract class is installed, by an administrator, on a node, as part of a packaged _contract CorDapp_ JAR file. Details of this will become clear in later modules.

## The commands

In a previous chapter it was mentioned that commands express intent. The exercise description hinted at 3 types of transactions that a token would have to implement:

* `Issue`
* `Move`
* `Redeem`

This is what the 3 commands are named here. Why these names? Simply because they mirror the naming convention in the specific Corda SDK that was alluded to previously. It is acceptable to choose different names for the same concepts. Your goal should be clarity.

Commands are part of a transaction in a very specific capacity, as such they need to extend the `interface CommandData` marker interface; _marker_ as in "this interface is empty". They could have been declared as top-level classes:

```java
class Issue implements CommandData {}
class Move implements CommandData {}
class Redeem implements CommandData {}
```
However it is a good idea to:

* Have them all identified by an intermediate marker interface in order to _group_ them conceptually together.
* Declare them as nested classes, not only of the contract, but of the marker interface itself, for elegant encapsulation.

This is why, inside `TokenContract`, you find:

```java
public class TokenContract implements Contract {
    [...]
    public interface Commands extends CommandData {
        class Issue implements Commands {}
        class Move implements Commands {}
        class Redeem implements Commands {}
    }
}
```
Of course, this means that when time comes to create a command instance, it will look like:

```java
new TokenContract.Commands.Issue()
```
It's long, very explicit and leaves no doubt. A good trade-off.

It is possible to add fields to your command classes. Here, there is no point or necessity for that. There could also have been an `enum` with the 3 values of `Issue`, `Move` and `Redeem`, and a single command, to which you'd add the right value of the enum. However, declaring one class per intent is the more idiomatic way to go.

Ok, let's move to the `verify` function. Remember that the `verify` function approves, or rejects, a **fully formed** transaction.

## A single command per transaction

The verification process starts by extracting **the** token command, using the same `requireSingleCommand` that was used in the example IOU contract:

```java
final CommandWithParties<Commands> command = requireSingleCommand(tx.getCommands(), Commands.class);
```
Things to notice:

* The contract asks for commands of type `Commands.class`, here you see again the benefit of declaring an intermediate marker interface. If you did not, you would need a line for each command type. Conversely, if you asked for the more general `CommandData`, then you would have to sift through all the commands from other contracts that you don't care about.
* It is asking for a **single** command: `requireSingleCommand`. So if there are 2 or more instances of `Commands`, then it will fail right there. Same if there are none.
* If it had asked for a single command on `CommandData`, then you would not be able to mix your actions with other contracts in a complex atomic operation. That would prevent secondary market operations.
* What it obtains is `CommandWithParties<Commands>` as indeed, the way that commands are implemented is by associating them with the signers.

## Preparing the states

A lot of the verification rests on the inputs and outputs, so it collects those it cares about:

```java
final List<TokenState> inputs = tx.inputsOfType(TokenState.class);
final List<TokenState> outputs = tx.outputsOfType(TokenState.class);
```
Notice that it only asked to get the states it is interested in: `TokenState`. The contract does not bother with other types of contract states.

{{<HighlightBox type="tip">}}

* On the one hand, it does not forbid the presence of other states, which expresses the understanding that most likely there is a business case for other states to be mixed with these tokens in atomic operations, such as airline tickets when issuing or redeeming, or digital cash when moving.
* On the other hand, it does not prescribe that there need to be other states present. It does not make assumptions about the future business case of these tokens. The contract even permits issuing, moving and redeeming _for free_. In effect, it is expressing the fact that the ledger layer does not care about the business case, it only cares about ensuring its consistency.

{{</HighlightBox>}}

It was mentioned earlier that the token state did not enforce its quantity to be strictly positive so as to keep all constraints in a single place. It is here that you want to enforce this. So let's prepare what is needed:

```java
final boolean hasAllPositiveQuantities =
        inputs.stream().allMatch(it -> 0 < it.getQuantity()) &&
                outputs.stream().allMatch(it -> 0 < it.getQuantity());
```
Streams again, where `.allMatch` returns `true` if and only if all elements match the given predicate.

Additionally, it is going to prepare the list of input holders. Even if it is not yet apparent, you start having an inkling that no token state can be consumed without the approval of, at least, its holder. So it collects some of the keys that are expected to be signers:

```java
final Set<PublicKey> allInputHolderKeys = inputs.stream()
        .map(it -> it.getHolder().getOwningKey())
        .collect(Collectors.toSet());
```
The `.collect(Collectors.toSet())` gets rid of duplicates for shorter collections. You may wonder why the `.map(it -> it.getHolder().getOwningKey())` lambda is used instead of:

```java
.map(TokenState::getHolder)
.map(Party::getOwningKey)
```
This time it was to see a lambda, and have the action be a bit more expressive, at the expense of more space used on the heap.

## Verifying

Let's enter into the meat of the verification. Since different `Issue`, `Move` and `Redeem` transactions are conceptually different, it is a good practice to separate the rest of the verification into `if else` statements. Hence:

```java
if (command.getValue() instanceof Commands.Issue) { [...]
} else if (command.getValue() instanceof Commands.Move) { [...]
} else if (command.getValue() instanceof Commands.Redeem) { [...]
} else {
    throw new IllegalArgumentException("Unknown command " + command.getValue());
}
```
Do not forget the final `else`. If you let that part out, the contract would **accept by default** all transactions if there was a 4th type of `Commands` that you had added to the list but forgotten to verify here. **Oops.**

So what needs to be checked in each `if` branch? Checks fall into 3 broad categories:

1. Constraints on the transaction shape
    1. It already checked that there should be a single `Commands`.
    2. How many inputs / outputs?
2. Constraints on states contents
    1. You need to think about what the constants, invariants, limits and so on are when it comes to the values in states.
3. Constraints on signers
    1. Make sure that those who lose an asset sign off on the deal.
    2. That those who gain a liability sign off too.
    3. Presumably, gaining a net asset or losing a net liability need not be signed off.
    4. Think through, maybe an asset contains a small liability, like a reporting or a tax obligation, which should be signed off.

So this is what you find in the example code. Notice again the use of the `ContractDSL`'s `requireThat` facility to reduce the `if (!happy) throw new IllegalArgument(why);` boilerplate. Of course, you are free to use standard Java as long as your code throws an exception when not `happy`. Let's run through the constraints decisions that have been made:

1. When `Issue`ing:
    1. Transaction shape:
        * It is an **issue**, so it expects at least an output:

        ```java
        req.using("There should be issued tokens.", !outputs.isEmpty());
        ```
        * It is **only** an issue, so it expects no inputs:

        ```java
        req.using("No tokens should be consumed when issuing.", inputs.isEmpty());
        ```
    2. State contents:
        * All quantities are positive:

        ```java
        req.using("All quantities must be above 0.", hasAllPositiveQuantities);
        ```
    3. Signers:
        * Each issuer must have signed on the transaction to prove it has accepted the tokens being issued in its name. This part is crucial. The following is optional but falls into the category of "getting the basics right to enable future secondary features" that were talked about. That is, the contract accepts 2 or more issuers as long as they signed for their respective tokens. In effect, it will not prevent 2 or more airlines coming to an agreement to issue together in an atomic operation. Who knows really? They may want to reward a given passenger for accepting a diversion from one airline to the other, whereby the 2 rewards are atomically awarded in the same ticket-change transaction. **Think big**, while ensuring the system's **ledger integrity** is not compromised. Note also that the contract is silent about how all the signers reached agreement, which is the purpose of flows:

        ```java
        req.using("The issuers should sign.",
                command.getSigners().containsAll(outputs.stream()
                        .map(it -> it.getIssuer().getOwningKey())
                        .collect(Collectors.toSet())
                ));
        ```
        Notice how the list of signers are extracted from the command: `command.getSigners()[...]`. During the `Issue`, it considers that the owners need not sign, presumably they are happy to receive the reward.
2. When `Move`ing, which is the operation where the holders change, but where the sums per issuer do not:
    1. Transaction shape:
        * Tokens **move**, so it expects at least an input and at least an output:

        ```java
        req.using("There should be tokens to move.", !inputs.isEmpty());
        req.using("There should be moved tokens.", !outputs.isEmpty());
        ```
        The count of inputs and outputs do not really matter. Remember, the token is fungible, so it is the sums that matter.
    2. State contents:
        * All quantities are positive, no surprise.
        * It wants to keep the sums per issuer unchanged. Remember `mapSumByIssuer`? It uses this utility function to first get all sums:

        ```java
        final Map<Party, Long> inputSums = TokenStateUtilities.mapSumByIssuer(inputs);
        final Map<Party, Long> outputSums = TokenStateUtilities.mapSumByIssuer(outputs);
        ```
        Then, using `AbstractSet.equals` function, it makes sure that no issuers are created or lost:

        ```java
        req.using("Consumed and created issuers should be identical.",
                inputSums.keySet().equals(outputSums.keySet()));
        ```
        Then again, for each issuer, it checks that the sums match:

        ```java
        req.using("The sum of quantities for each issuer should be conserved.",
                inputSums.entrySet().stream()
                        .allMatch(entry -> outputSums.get(entry.getKey()).equals(entry.getValue())));
        ```
    3. Signers:
        * Each holder must have accepted a change in their holdings, because they are losing an asset:

        ```java
        req.using("The current holders should sign.",
                command.getSigners().containsAll(allInputHolderKeys));
        ```
3. When `Redeem`ing, you should get the gist now:
    1. Transaction shape:
        * Tokens are **redeemed**, so it expects at least an input:

        ```java
        req.using("There should be tokens to redeem.", !inputs.isEmpty());
        ```
        * They are **only** redeemed, so it expects no outputs:

        ```java
        req.using("No tokens should be issued when redeeming.", outputs.isEmpty());
        ```
    2. State contents:
        * No surprises, all quantities are positive:

        ```java
        req.using("All quantities must be above 0.", hasAllPositiveQuantities);
        ```
    3. Signers. It was mentioned earlier that the approval of both the issuers and the holders are needed for a redeem transaction to happen, so here goes:
        * Each issuer must approve the destruction of the tokens it issued as it is the entity in control of its total supply. This is crucial. The following is optional but, again, falls into the category of "getting the basics right to enable future secondary features". That is, the contract accepts redemption from 2 or more issuers as long as they signed for their respective tokens. In effect, it will not prevent 2 or more airlines coming to an agreement to redeem together in an atomic operation. Perhaps they may want to let a passenger redeem a return ticket where going out is with an airline and coming back is with the other, all transacted atomically:

        ```java
        req.using("The issuers should sign.",
                command.getSigners().containsAll(inputs.stream()
                        .map(it -> it.getIssuer().getOwningKey())
                        .collect(Collectors.toSet())
                ));
        ```
        * Each holder must approve the destruction too. They are losing an asset after all, so this is important. And, optionally again, multiple holders are allowed in the same transaction, in order to permit, for instance a couple redeeming their respective tokens for 2 tickets on the same trip:

        ```java
        req.using("The current holders should sign.",
                command.getSigners().containsAll(allInputHolderKeys));
        ```

## [Tests](https://github.com/corda/corda-training-code/tree/master/020-first-token/contracts/src/test/java/com/template/contracts)

Thoroughly testing a contract can be a tedious affair, so you may want to split those in more than one file. For instance, a single test file for a single command. This is what happened here: `TokenContractMoveTests` tests only for `Move` for instance. Beside that, you should already be familiar with the mocks and utils used in contract tests.

As you go through them, you will notice that each verification aspect is tested:

* Presence of a command
* Shape of the transaction
* Constraints on the states
* Signer constraints

And of course, there is a complex transaction example that passes: don't forget to show to the future user of your contract how to use it.

## In closing

Did you get the crucial checks right when you wrote your own token contract? If:

* You were too lax, you need to think more adversarially, putting yourself in the shoes of a malicious actor trying to gain undue benefits. The ledger's integrity is of utmost importance.
* You were too restrictive, try to think big and differentiate what is really necessary for the system's integrity. Separate this from the mental straightjacket you have about the world as you know it. For instance, when an airline rejects miles from 2 different holders, is it a system's integrity matter or is it a business decision? Would a more passenger-friendly airline choose differently? Might the policy differ between airlines or over time? Also, as you are about to move on to the flows, you will see that actors still have a lot of leeway to restrict what they accept, even when the contract would accept it. If it is cognitively useful, remember that a dollar or an air-mile should be indifferent to how it is spent, or for what purpose, but certain properties define what they are.

And, don't skip tests.
