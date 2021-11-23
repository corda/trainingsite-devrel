---
title: Introduction to Libraries
description: Thou shalt not reinvent the wheel
slug: introduction
menu:
  main:
    parent: libraries
    weight: 10  
weight: 10
---

In the previous module, you created a _token_&nbsp;--a widely re-useable pattern. It was a fungible token, to be more precise. Congratulations.

The concept of a token is in fact so universal that R3 decided to create an SDK that can create all sorts of tokens. You will discover it in more detail in the next chapter. On a more general level, there are many existing patterns and classes that have already been implemented. Reusing them can not only save you time, but also help you agree on a _vocabulary_ to use when discussing or interacting with others. Here, you will discover some of these concepts, non-exhaustively. It is always good to explore the docs or the code to look for well-solved implementations that are close to what you want.

After several chapters on the Tokens SDK, in the same module, you will learn about another library, Accounts, and discover Visual Studio Code, and how you might want to use it as your primary IDE.

## Reusable classes for the previous exercise

### For the state

When you created your token, ostensibly for an air-mile token type, did you use any of the following existing classes?

* [`Amount`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/contracts/Amount.kt#L42) to assist you in handling quantities, conversions and operations.
* [`Issued`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/contracts/Structures.kt#L50) to loosely couple an issuer and a type.
* [`interface OwnableState`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/contracts/Structures.kt#L82) which would make your air-mile easily identifiable to others as one with an owner.
* [`interface FungibleState`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/contracts/FungibleState.kt#L29) would let you identify something with the property that all instances are materially equivalent, so only the amount&nbsp;/ quantity is important.

The previous exercise example did not use any of those either, but here is an example of what [could have been](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/contracts/src/main/java/com/template/states/TrialToken.java):

```java
public class TrialToken<T> implements FungibleState<Issued<T>>, OwnableState {

    @NotNull
    private final Amount<Issued<T>> amount;
    @NotNull
    private final AbstractParty owner;

    public TrialToken(
            @NotNull final Amount<Issued<T>> amount,
            @NotNull final AbstractParty owner) {
        this.amount = amount;
        this.owner = owner;
    }

    @NotNull
    @Override
    public Amount<Issued<T>> getAmount() {
        return amount;
    }

    @NotNull
    @Override
    public List<AbstractParty> getParticipants() {
        return Collections.singletonList(owner);
    }

    @NotNull
    @Override
    public AbstractParty getOwner() {
        return owner;
    }

    @NotNull
    public AbstractParty getIssuer() {
        return amount.getToken().getIssuer().getParty();
    }

    @NotNull
    public T getProduct() {
        return amount.getToken().getProduct();
    }

    @NotNull
    @Override
    public CommandAndState withNewOwner(@NotNull final AbstractParty newOwner) {
        throw new NotImplementedException("We need a contract command");
    }
}
```
Note the usage of `Amount<Issued<T>> amount` to couple the quantity and the issuer. Remember this coupling as you will see it again. In fact, even this part:

```java
implements FungibleState<Issued<T>>, OwnableState
```
already exists as [`interface FungibleAsset<T>`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/contracts/FungibleAsset.kt#L31). It's amusing that even in `TrialToken` above, where existing classes were wisely reused, it just so happens that it nonetheless reinvented `FungibleAsset`. Let's make use of this class in our `QuickAirMileToken`:

```java
public class QuickAirMileToken implements FungibleAsset<QuickAirMileToken.AirMile> {

    // The underlying product.
    public static class AirMile {}

    @NotNull
    private final Party issuer;
    @NotNull
    private final Amount<Issued<AirMile>> amount;
    @NotNull
    private final AbstractParty owner;

    public QuickAirMileToken(
            @NotNull final Party issuer,
            @NotNull final Amount<Issued<AirMile>> amount,
            @NotNull final AbstractParty owner) {
        this.issuer = issuer;
        this.amount = amount;
        this.owner = owner;
    }

    @NotNull
    @Override
    public List<AbstractParty> getParticipants() {
        return Collections.singletonList(owner);
    }

    @NotNull
    @Override
    public Amount<Issued<AirMile>> getAmount() {
        return amount;
    }

    @NotNull
    @Override
    public AbstractParty getOwner() {
        return owner;
    }

    @NotNull
    @Override
    public Collection<PublicKey> getExitKeys() {
        return Arrays.asList(issuer.getOwningKey(), owner.getOwningKey());
    }

    @NotNull
    @Override
    public QuickAirMileToken withNewOwnerAndAmount(@NotNull Amount<Issued<AirMile>> newAmount, @NotNull AbstractParty newOwner) {
        return new QuickAirMileToken(issuer, newAmount, newOwner);
    }

    @NotNull
    @Override
    public CommandAndState withNewOwner(@NotNull AbstractParty newOwner) {
        throw new NotImplementedException("Needs contract command");
    }
}
```
This implementation is not added to the course project folder because of a bug that is on track to be fixed in Java. The curious reader can try in Kotlin.

What about [`LinearState`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/contracts/Structures.kt#L128), that you saw in `IOUState`? No, it's not conducive to a fungible air-mile token because the idea of a `LinearState` is that there should be only one unconsumed state by a given id. There can be no plan of tracking individual tokens because that would be, by definition, non-fungible.

### For the contract

If you poke around, you can see that there is an [`OnLedgerAsset`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/finance/contracts/src/main/kotlin/net/corda/finance/contracts/asset/OnLedgerAsset.kt#L33) contract:

```kotlin
abstract class OnLedgerAsset<T : Any, out C : CommandData, S : FungibleAsset<T>> : Contract
```
that seems to achieve what your `TokenContract` achieved. Poring through its code is more involved than the quick examples above, but you can recognize helper functions in its `Companion` object:

* Issue: [`generateIssue`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/finance/contracts/src/main/kotlin/net/corda/finance/contracts/asset/OnLedgerAsset.kt#L296-L298)
* Move: [`generateSpend `](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/finance/contracts/src/main/kotlin/net/corda/finance/contracts/asset/OnLedgerAsset.kt#L57-L63)
* Redeem: [`generateExit`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/finance/contracts/src/main/kotlin/net/corda/finance/contracts/asset/OnLedgerAsset.kt#L231-L235)

However, it is in the demo `corda-finance-contracts` CorDapp. R3 [advises against](https://docs.corda.net/docs/corda-os/4.3/cordapp-advanced-concepts.html#the-demo-finance-cordapp) using it in production, but this is learning, so add it to your "contracts" `build.gradle`:

```groovy
dependencies {
    ...
    cordapp "$corda_release_group:corda-finance-contracts:$corda_release_version"
}
```
You can create your contract `QuickAirMileContract` now:

```java
public class QuickAirMileContract extends OnLedgerAsset<
        QuickAirMileToken.AirMile,
        QuickAirMileContract.Commands,
        QuickAirMileToken> {

    @NotNull
    @Override
    public TransactionState<QuickAirMileToken> deriveState(
            @NotNull final TransactionState<? extends QuickAirMileToken> txState,
            @NotNull final Amount<Issued<QuickAirMileToken.AirMile>> amount,
            @NotNull final AbstractParty owner) {
        return new TransactionState<>(
                txState.getData().withNewOwnerAndAmount(amount, owner),
                txState.getContract(),
                txState.getNotary(),
                txState.getEncumbrance(),
                txState.getConstraint());
    }

    @NotNull
    @Override
    public Collection<CommandWithParties<Commands>> extractCommands(
            @NotNull final Collection<? extends CommandWithParties<? extends CommandData>> commands) {
        //noinspection unchecked
        return commands.stream()
                .filter(it -> it.getValue() instanceof Commands)
                .map(it -> (CommandWithParties<Commands>) it)
                .collect(Collectors.toList());
    }

    @NotNull
    @Override
    public CommandData generateExitCommand(@NotNull Amount<Issued<QuickAirMileToken.AirMile>> amount) {
        return new Commands.Redeem();
    }

    @NotNull
    @Override
    public MoveCommand generateMoveCommand() {
        return new Commands.Move();
    }

    @Override
    public void verify(@NotNull LedgerTransaction tx) throws IllegalArgumentException {
        throw new NotImplementedException("That's a lot of work");
    }

    public interface Commands extends CommandData {
        @SuppressWarnings("unused")
        class Issue implements Commands {
        }

        class Move implements Commands, MoveCommand {
            @Nullable
            @Override
            public Class<? extends Contract> getContract() {
                return QuickAirMileContract.class;
            }
        }

        class Redeem implements Commands {
        }
    }
}
```
But let's stop here, because implementing `verify` is still as much work as the exercise of the previous module.

If you are inclined to digress a bit, have a look at the example [`Cash.State`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/finance/contracts/src/main/kotlin/net/corda/finance/contracts/asset/Cash.kt#L42) implementation of `OnLedgerAsset`.

## Conclusion

Despair not, you did your own `TokenState` and that was a great learning experience. Still, in the future, it is always a good idea to see if there is not already a few classes that will assist you in improving the interoperability of your CorDapp with existing CorDapps.

Let's stay on the topic of tokens. You are going to master this subject and discover the Tokens SDK library in the next chapter.
