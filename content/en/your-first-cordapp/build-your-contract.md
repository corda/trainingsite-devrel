---
title: Build Your Contract
description: An example contract solution
slug: build-your-contract
menu:
  main:
    parent: your-first-cordapp
    weight: 30  
weight: 30
---

In the previous chapter, you saw an example solution of the `IOUState`. In this chapter, you will have a look at an example solution of `IOUContract`.

As always, there is no single truth as to implementation, but the hope is that you will reflect on your first attempt given the remarks therein. Let's go. For quick reference find the code in [Java](https://github.com/r3developer/obligation-cordapp).

{{<HighlightBox type="warn">}}

Ok, fasten your seat belts. This class is important. You see, this is here that you ensure that no funny business takes place on your Corda distributed ledger. This cannot be over-stressed.

{{</HighlightBox>}}

First, before the below discussion, let's see a diagram that sums up the entire functioning of our CorDapp. You will see, how we impose checks for all the three functions- Issue, Transfer and Settle, that our CorDapp will allow.

![CDL view of contract and state machine](/your-first-cordapp/iou_tokenstate_machine_view.png)

## The class declaration

```java
public class IOUContract implements Contract {
    // Used to identify our contracts when building a transaction
    public static final String IOU_CONTRACT_ID = "net.corda.samples.obligation.contracts.IOUContract";
```
If you want your `IOUContract` to be used as a contract in Corda, it has to implement `Contract `, so that's a given.

The `IOU_CONTRACT_ID` string will be used by the transaction builder to identify which contract to attach to a state by way of pseudo-reference. In fact, it is also cross-checked with the `@BelongsToContract` annotation on the state. Unlike a state, a contract is stateless and not serialized, nor is it transmitted over the wire to the relevant peers. Instead, any contract class is installed, by an administrator, on a node, as part of a packaged contract CorDapp JAR file. Details of this will become clear in later modules.

## The commands

The commands are used to express intent. Here, we have 3 operations that our CorDapp should implement:

* `Issue`
* `Transfer`
* `Settle`

This is what the 3 commands are named here. It is acceptable to choose different names for the same concepts. Your goal should be clarity.

Commands are part of a transaction in a very specific capacity, as such they need to extend the `interface CommandData` marker interface; _marker_ as in "this interface is empty". They could have been declared as top-level classes:

We define a simple grouping interface or static class, this gives us a type that all our commands have in common, then we go ahead and create three commands: Issue, Transfer, Settle. TypeOnlyCommandData is a helpful utility for the case when there’s no data inside the command; only the existence matters. So, here we use TypeOnlyComandData as we don’t need data inside the command.

```java
public interface Commands extends CommandData {
    class Issue extends TypeOnlyCommandData implements Commands{}
    class Transfer extends TypeOnlyCommandData implements Commands{}
    class Settle extends TypeOnlyCommandData implements Commands{}
}
```

Thus, when the time comes to create a command instance, it could directly use:

```java
new IOUContract.Commands.Issue()
```

It's long, very explicit, and leaves no doubt. A good trade-off.

Ok, let's move to the `verify` function. The `verify` function approves or rejects, a **fully formed** transaction.

## A single command per transaction

The verification process starts by extracting the command from the transaction, using the same `requireSingleCommand` that was used in the example IOU contract:

```java
final CommandWithParties<Commands> command = requireSingleCommand(tx.getCommands(), Commands.class);
```

Things to notice:

* The contract asks for commands of type `Commands.class`, here you see again the benefit of declaring an intermediate marker interface. If you did not, you would need a line for each command type. Conversely, if you asked for the more general `CommandData`, then you would have to sift through all the commands from other contracts that you don't care about. 
* It is asking for a **single** command: `requireSingleCommand`. So if there are 2 or more instances of `Commands`, then it will fail right there. Same if there are none. 
* What it obtains is `CommandWithParties<Commands>` as indeed, the way that commands are implemented is by associating them with the signers.

For each of the Commands, you will need different constraints and checks.


## Verifying

Let's look into the details of the verification. Since different `Issue`, `Transfer`, and `Settle` transactions are conceptually different, it is a good practice to separate the rest of the verification into `if else` statements. We have defined separate methods, just to make the code more readable. Even if you add your logic in the if-else block, that implementation is also fine.

```java
final Commands commandData = command.getValue();
```

```java
if(commandData instanceof Commands.Issue)
    verifyIssue(tx);
else if(commandData instanceof Commands.Transfer)
    verifyTransfer(tx);
else if (commandData instanceof Commands.Settle)
    verifySettle(tx);
else
    throw new IllegalArgumentException("Invalid Command");
}
```
Do not forget the final `else`. If you let that part out, the contract would **accept by default** all transactions if there was a 4th type of `Commands` that you had added to the list but forgotten to verify here. **Oops.**

So what needs to be checked in each `if` branch? Checks fall into 3 broad categories:

1. Constraints on the transaction shape
    1. It already checked that there should be a single `Commands`.
    2. How many inputs/outputs?
2. Constraints on states contents
   1. You need to think about what the constants, invariants, limits, and so on are when it comes to the values in states.
3. Constraints on signers
   1. Make sure that those who lose an asset must sign off on the deal.
   2. That those who gain a liability must sign off too.
   3. Think through, maybe an asset contains a small liability, like a reporting or a tax obligation, which should be signed off.

Manually throwing an exception for each constraint like below can be verbose.

```java
if (tx.getInputs().size() > 0)
    throw new IllegalArgumentException("No inputs should be consumed when issuing an X.");
if (tx.getOutputs().size() != 1)
    throw new IllegalArgumentException("Only one output state should be created.");```
```

We could use the `requireThat` instead:

```java
requireThat(require -> {
 require.using("No inputs should be consumed when issuing an IOU.", tx.getInputStates().size() == 0);
```

1. When `Issue`ing:
   1. Transaction shape:
      * It is an **issue**, so it should not consume any input.

      ```java
      require.using("No inputs should be consumed when issuing an IOU.", tx.getInputStates().size() == 0);
      ```
      
      * It is an issue, so it expects at least an output:

      ```java
      require.using( "Only one output states should be created when issuing an IOU.", tx.getOutputStates().size() == 1);
      ```
      
   2. State contents:
       * The IOU amount should be positive:

       ```java
       IOUState outputState = tx.outputsOfType(IOUState.class).get(0);
       require.using( "A newly issued IOU must have a positive amount.",
       outputState.getAmount().getQuantity() > 0);
       ```
     
      * The lender and the borrower cannot be the same identity.

      ```java
      require.using( "The lender and borrower cannot have the same identity.", outputState.getLender().getOwningKey() != outputState.getBorrower().getOwningKey());
      ```   

   3. Signers:
       * Both lender and borrower must sign the transaction to prove that they agree to the obligation. This part is crucial. For further enhancements, you may have a regulator sign the transaction. But for now, it's optional and the focus now should be to get the basics functional.

       ```java
       List<PublicKey> signers = tx.getCommands().get(0).getSigners();
         HashSet<PublicKey> signersSet = new HashSet<>();
         for (PublicKey key: signers) {
         signersSet.add(key);
       }

       List<AbstractParty> participants = tx.getOutputStates().get(0).getParticipants();
         HashSet<PublicKey> participantKeys = new HashSet<>();
         for (AbstractParty party: participants) {
           participantKeys.add(party.getOwningKey());
         }

       require.using("Both lender and borrower together only may sign IOU issue transaction.", signersSet.containsAll(participantKeys) && signersSet.size() == 2);
     
       return null;
       ```
     
2. When `Transfer`ing, which is the operation where the – lender for the IOU state changes:
   1. Transaction shape:
       * The transaction should consume a single state and output a single state.

       ```java
       require.using("An IOU transfer transaction should only consume one input states.", tx.getInputStates().size() == 1);
       require.using("An IOU transfer transaction should only create one output states.", tx.getOutputStates().size() == 1);
       ```

   2. State contents:
       * The output state must preserve all the other data values, but only the lender should change.

       ```java
       IOUState inputState = tx.inputsOfType(IOUState.class).get(0);
       IOUState outputState = tx.outputsOfType(IOUState.class).get(0);
       IOUState checkOutputState = new IOUState(outputState.getAmount(), inputState.getLender(), outputState.getBorrower(), outputState.getPaid(), outputState.getLinearId());

       require.using("Only the lender property may change.", 
               (checkOutputState.getAmount() == inputState.getAmount()) && checkOutputState.getLinearId().equals(inputState.getLinearId()) && checkOutputState.getBorrower().equals(inputState.getBorrower()) && (checkOutputState.getPaid() == inputState.getPaid()));
       ```

      * We must also ensure that the new lender must be different than the old lender.
  
      ```java
      require.using("The lender property must change in a transfer.", !outputState.getLender().getOwningKey().equals(inputState.getLender().getOwningKey()));
      ```

   3. Signers:
       * The borrower, the old lender, and the new lender should all sign the transaction. In other words, all of them must have accepted a change in their holdings, because some of them are losing an asset and some are gaining.

       ```java
       Set<PublicKey> listOfParticipantPublicKeys = inputState.getParticipants().stream().map(AbstractParty::getOwningKey).collect(Collectors.toSet());
       listOfParticipantPublicKeys.add(outputState.getLender().getOwningKey());
       List<PublicKey> arrayOfSigners = tx.getCommand(0).getSigners();
       Set<PublicKey> setOfSigners = new HashSet<PublicKey>(arrayOfSigners);
       require.using("The borrower, old lender and new lender only must sign an IOU transfer transaction", setOfSigners.equals(listOfParticipantPublicKeys) && setOfSigners.size() == 3);
       ```
     
3. When `Settle`ing, it won’t be that straightforward as before. It could either be a part settlement or a full settlement. For input, there has to be one and only one state. For the output, there should be an IOU state of the remaining amount or in case of full settlement, there should not be an IOU state.

   ```java
   // Check that only one input IOU should be consumed.
   require.using("One input IOU should be consumed when settling an IOU.", tx.getInputStates().size() == 1);

   IOUState inputIOU = tx.inputsOfType(IOUState.class).get(0);
   int inputAmount = inputIOU.getAmount();

   // Check if there is no more than 1 Output IOU state.
   require.using("No more than one output IOU should be created", tx.getOutputStates().size() <= 1);
   ```

   If there is an output state, then it must be a part settlement.

   ```java
   // Check if there is no more than 1 Output IOU state.
   require.using("No more than one output IOU should be created", tx.getOutputStates().size() <= 1);
   if(tx.getOutputStates().size() == 1){
      // This means part amount of the obligation is settled.
      IOUState outputIOU = tx.outputsOfType(IOUState.class).get(0);
      require.using("Only the paid amount can change during part settlement.",
      (outputIOU.getAmount() == inputAmount) && outputIOU.getLinearId().equals(inputIOU.getLinearId()) && outputIOU.getBorrower().equals(inputIOU.getBorrower()) && outputIOU.getLender().equals(inputIOU.getLender()));
      require.using("The paid amount must increase in case of part settlement of the IOU.", (outputIOU.getPaid() > inputIOU.getPaid()));
      require.using("The paid amount must be less than the total amount of the IOU", (outputIOU.getPaid() < inputIOU.getAmount()));
   }
   ```

   Both the lender and borrower must sign the transaction.
   ```java
   Set<PublicKey> listOfParticipantPublicKeys = inputIOU.getParticipants().stream().map(AbstractParty::getOwningKey).collect(Collectors.toSet());
   List<PublicKey> arrayOfSigners = tx.getCommand(0).getSigners();
   Set<PublicKey> setOfSigners = new HashSet<PublicKey>(arrayOfSigners);
   require.using("Both lender and borrower must sign IOU settle transaction.", setOfSigners.equals(listOfParticipantPublicKeys));
   ```


## [Tests](https://github.com/corda/corda-training-code/tree/master/020-first-token/contracts/src/test/java/com/template/contracts)

Thoroughly testing a contract can be a tedious affair, so you may want to split those in more than one file. For instance, a single test file for a single command. This is what happened here: `IOUIssueTests` tests only for `Issue` for instance. Besides that, you should already be familiar with the mocks and utils used in contract tests.

As you go through them, you will notice that each verification aspect is tested:

* Presence of a command
* Shape of the transaction
* Constraints on the states
* Signer constraints

And of course, there is a complex transaction example that passes: don't forget to show to the future user of your contract how to use it.

## In closing

Did you get the crucial checks right when you wrote your contract? If:

* You were too lax, you need to think more adversarial, putting yourself in the shoes of a malicious actor trying to gain undue benefits. The ledger's integrity is of utmost importance. Also note, the idea here is not to get everything right in the first go, but to understand the concepts and then incorporate adversarial thinking.
