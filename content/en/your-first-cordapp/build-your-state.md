---
title: Build Your State
description: Create a state and a contract
slug: build-your-state
menu:
  main:
    parent: your-first-cordapp
    weight: 20  
weight: 20
---

Now, that you have had a look at a simple CorDapp, you are ready to create your very own first project; your first CorDapp. This is a guided exercise with a solution. For the best learning result, work on your own before peeking at the solution.

{{<HighlightBox type="tip">}}

The _solutions_ will introduce concepts that are important to understand even if your end goal is not to code. Be sure to peruse the explanation to deepen your understanding of important considerations.

{{</HighlightBox>}}

Let's dive right away into the exercise, starting with something simple, and approximately universal: an obligation agreement or you could think of it as a loan agreement between two parties: a borrower and a lender. This will be an enhanced version of the IOU CorDapp you saw earlier.

## The goal

Your goal is to create the state and contract, and eventually flows that implement an obligation agreement. Here, we refer to the obligation agreement as a simple “IOU”- “I OWE YOU” agreement. An IOU will record the fact that one node owes another node a certain amount. Thus, this will be an extension of the CorDapp example from the last section. First, our CorDapp should allow the creation of such an obligation agreement, then the ability to transfer the obligation to another party(changing the lender), and finally an option to settle up. While settling up, one could have two options: a part settlement where a part of the total amount owed is settled and a full settlement. In summary, we will be doing the following: issuing IOU, transferring them between parties, and then settling up the IOU.

For this exercise, you will avoid all the regulatory concerns that may become applicable in a real-world scenario, such as the inclusion of regulators, auditors, etc. Here, we keep things simple with the minimum number of parties required to execute the complete flow. It is assumed that the cash transfer during settlement happens outside of the ledger. For, further enhancements, you may use the Tokens SDK, which enables the settlement of the IOU using on-ledger cash/tokens.

## More details

With this in mind, you will begin to see the outlines of the design.

* The actions:
  * Issue IOU, a.k.a. mint, create.
  * Transfer IOU, a.k.a. move
  * Settle IOU, a.k.a. destroy (In case of part settlement – no destroy)
  * For now, focus on the state and contract. You will focus on flows when those issues are well-solved.

{{<HighlightBox type="tip">}}

Why not code the flows as well, and attempt it in one sweep?

1. When deploying your CorDapp, it is a good practice to distribute the state&nbsp;+ contract JAR together and distribute a separate JAR with the flows. So let's conceptually separate the two now.
2. It is a devastating rookie mistake to leave the contract overly permissive and enforce restrictions at the flow level. By focusing exclusively on the contract first, you will form the habit of observing this best practice.
3. You have enough on your plate already just with the state, the contract, and tests.

{{</HighlightBox>}}

## Write code

Your best starting point at this stage is to either use the [Java template](https://github.com/corda/cordapp-template-java) or the [Kotlin template](https://github.com/corda/cordapp-template-kotlin) and create your classes as necessary. If you still feel uncomfortable with an empty template, you can use the [CorDapp example](https://github.com/corda/samples-java/tree/master/Basic/cordapp-example) as a starting point and modify it as necessary.

Add unit tests that cover all actions and situations. Yes, tests! You are not going to release untested states and contracts in the wild. Try to think creatively and adversarially, whereby parties in the network would try to game the system to gain an unfair advantage. Your code should prevent such possibilities, and your tests should prove that your defenses are effective.

Keep the code generic. In particular, when naming entities, you want your code to be reusable at a later stage.

Some hints are rolled up below. Think on your own before you unroll them. The next chapter is an example implementation. Again, for your benefit, resist the urge to peek unless you are utterly stuck.

{{<ExpansionPanel title="HINT">}}
{{<ExpansionPanelList>}}
{{<ExpansionPanelListItem number="0a">}}

### Are you stuck?

{{</ExpansionPanelListItem>}}
{{<ExpansionPanelListItem number="0b">}}

### Really stuck?

{{</ExpansionPanelListItem>}}
{{<ExpansionPanelListItem number="1">}}

### Ok, the state:

* What would be an appropriate, generalized name for the state?
  * `IOUState`
* What are the properties your IOUState should hold? Should it keep the amount owed?
  * Yes
* Should it identify the lender?
  * Yes
* Should it identify the borrower?
  * Yes
* Should it keep the amount that has been paid? This will be needed for the part-settlement of the IOU.
  * Yes
* What are the sensible constraints for this class?
  * quantity strictly positive; do this here or in the contract?
* Who are the participants?
  * The lender and the borrower

Something that would look like:

![View of IOUState.](/your-first-cordapp/iou_tokenstate.png)

This is a section of the CDL( CorDapp Design Language) view of the IOU State. Corda Design Language helps to effectively structure and organize your CorDapp. As this is a very simple CorDapp, you will not require to go into much detail about CDL. For complex CorDapps, you can use CDL to concisely and accurately guide the design of your CorDapp.

{{</ExpansionPanelListItem>}}
{{<ExpansionPanelListItem number="2">}}

### The contract:

* What should you name it to be generic enough?
  * `IOUContract`
* What are the commands that will make intent explicit?
  * `Issue`, `Transfer` and `Settle`
* What are the transaction shape constraints to impose on each action, without preventing mixing with other unrelated states and contracts?
  * inputs count, outputs count
* What are the state's constraints to impose on each action?
  * Amount must be positive for Issue.
* What are the signatures constraints to impose on each action?
  * signed by lender or borrower or both
* Other constraints?


{{</ExpansionPanelListItem>}}
{{</ExpansionPanelList>}}
{{</ExpansionPanel>}}


## Your First State

- Ok, you have done your exercise, you have your own `IOUState` and `IOUContract`. Now, compare what you did to this example below. The point is not to get the exact code, but to get an understanding of the CorDapp components and their functions.
- `IOUState` solution is given below. You will find a solution to `IOUContract` in the next chapter. As always, there is no single truth as to implementation, but the hope is that you will reflect on your first attempt given the remarks found here. Let's go.
- You will notice that, as much as possible, variables are marked `final` and `private`, and annotated as `@NotNull` and lists are made immutable, and so on. The goal here is to introduce strictness and let the compiler warn as early as possible when the developer is doing something untoward.
- For quick reference find the code in [Java](https://github.com/r3developer/obligation-cordapp)
- In IntelliJ, you could open the relevant project folder i.e. obligation-cordapp. Refer to the same project code for Contract as well as flows.
- Let's review the work that was achieved here, and the rationales behind certain decisions. But first, a summary diagram of the `IOUState`:

![CDL view of TokenState](/your-first-cordapp/iou_tokenstate.png)

## The class declaration

```java
@BelongsToContract(IOUContract.class)
public class IOUState implements ContractState, LinearState {
```
You want your `IOUState` to be used as state in Corda, so it has to implement `ContractState`.

Corda states cannot be appended. But we do want an audit trail for the evolution of the state. Hence we implement the `LinearState`. It allows us to represent an evolving fact as a sequence of `LinearState` states that share the same `linearId` and represent an audit trail for the lifecycle of the fact over time. We have also introduced linearId as a property in the state.

Once we have a state object created on the ledger(i.e added a transaction to create the state) and want to extend a `LinearState` chain (i.e. a sequence of states sharing a `linearId`), we:

- Use the `linearId` to extract the latest state in the chain from the vault
- Create a new state that has the same `linearId`
- Create a transaction with:
- The current latest state in the chain as an input
- The newly-created state as an output

The new state will now become the latest state in the chain, representing the new current state of the agreement.

A state's lifecycle is _controlled_ by the contract that will allow its creation and consumption. So it is important for you, the developer, to identify which contract the state expects for protection. This is the role of `@BelongsToContract`. You will notice that:

```java
@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.CLASS)
annotation class BelongsToContract(val value: KClass<out Contract>)
```
The `BelongsToContract` annotation carries over at runtime, which allows the Corda system to cross-check whether it is instructed to use the expected contract when verifying a transaction.

Dig into [`ContractState`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/contracts/ContractState.kt#L16-L17) and see that this class is `@CordaSerializable`. Indeed, it is expected that a state needs to be serialized and transmitted over the wire to the relevant parties. It is thus important that all your fields are marked as serializable as well.

## The fields

The first four state's fields are, hopefully, self-explanatory. We have introduced another field named `UniqueIdentifier`. This field will store the `linearId` for the state object.

```java
private final Amount<Currency> amount;
private final Party lender;
private final Party borrower;
private final Amount<Currency> paid;
private final UniqueIdentifier linearId;
```

These 3 **keywords** will be found throughout the code so, let's talk about them a bit:

* `final`: because an attribute has been set, it is good to have the assurance that it cannot be changed, even internally. Variables that change after they have potentially been checked are unwelcome. Additionally remember that when a state has been created by way of a transaction it is, in effect, immutable. So it is best to express this inevitability.
* `private`: because you are best served to protect your attributes. If a value needs to be accessible, then you create a getter like this:

    ```java
    @NotNull
    public Party getBorrower() {
        return borrower;
    }
    ```
  Even though, in this example `Party` is an immutable type, having function getters allow for greater flexibility if you change internal parts of the `IOUState`, without having to refactor users of the state.
* `@NotNull`: so as to be warned by the compiler if you try to pass potentially `null` values.

Why choose these **types**:

* `Party` as the identifiers of `lender` and `borrower`. Why not `AbstractParty`? A `Party` is clearly identified, on the other hand, if you choose `AbstractParty`, you make it possible in the future to use `AnonymousParty` and keep identities disclosed only to those that need to know. If you have a specific scenario, you may use `Anonymous Party`. However, dealing with `AnonymousParty` is an advanced topic that is best left for later.
* `int` for the `amount` and  `paid` . We will keep things simple and use int to represent the total amount of the IOU and the paid amount from the total IOU.


## The constructor

```java
public IOUState(@NotNull final int amount, @NotNull final Party lender, @NotNull final Party borrower) {
```

This Constructor will be used while creating a new IOU. Notice that we have another constructor as well

```java
@ConstructorForDeserialization
public IOUState(@NotNull final int amount,@NotNull final Party lender,@NotNull final Party borrower,@NotNull final int paid,@NotNull final UniqueIdentifier linearId){

```

This constructor will be used for creating state objects during Transfer Flow, Settle Flow, and for the unit tests. Note the @ConstructorForDeserialization annotation. As we have more than one constructor, the serialization framework needs to know which one to use. The [@ConstructorForDeserialization](https://docs.r3.com/en/platform/corda/4.8/enterprise/upgrading-cordapp.html#writing-classes-that-meet-the-serialisation-format-requirements) annotation can be used to indicate the chosen constructor.

## The participants

The participants is the list of parties that **have to** be informed of every change to the state. When informed of a change, these parties will also, by default, save the relevant states to their vaults. Of course, other parties not mentioned in the participants can also be kept informed, if needed. This is addressed in the flows, as shall eventually be seen.

```java
@NotNull
@Override
public List<AbstractParty> getParticipants() {
    return ImmutableList.of(lender, borrower);
}
```

Notice the use of `ImmutableList`. It creates an immutable list. You cannot just `.add` elements to it. In effect, you lose some convenience. If you really mean to use this list of participants and add to it in order to inform more parties than just the basic participants, then you will have to create a brand new list. There is a benefit hidden in this convolution: doing so makes your code **explicit** in its intent to inform more than the regular participants.

## [Tests](https://github.com/corda/corda-training-code/blob/master/020-first-token/contracts/src/test/java/com/template/states/TokenStateTests.java)

Some basic tests are performed on `IOUState`:

* Confirm all the parameters are of the correct type.
* Confirm the parties are included in the list of participants

Notice, we have defined another class `TestUtils` which is used to define identities of multiple parties used during the tests. Also, notice the use of `TestIdentity` which hides away the complexity of signing keys so you can focus on testing your code.

### In closing

Did you get most of it right?

And don't skip tests.
