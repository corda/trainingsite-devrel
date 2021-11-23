---
title: State example solution
description: An example state solution
slug: solution-state
menu:
  main:
    parent: first-code
    weight: 30
weight: 30
---


Ok, you have done your exercise, you have your own `TokenState` and `TokenContract`. Now, compare what you did to this example that displays some best practice, starting with `TokenState`. You will find a solution to `TokenContract` in the next chapter. As always, there is no single truth as to implementation, but the hope is that you will reflect on your first attempt given the remarks found here. Let's go.

This document will link to Java code, but you will also find the Kotlin implementation nearby and notice it is often more succinct.

You will notice that, as much as possible, variables are marked `final` and `private`, and annotated as `@NotNull`, lists are made immutable, and so on. The goal here is to introduce strictness and let the compiler warn as early as possible when the developer is doing something untoward.

Find the `TokenState` code in [Java](https://github.com/corda/corda-training-code/blob/master/020-first-token/contracts/src/main/java/com/template/states/TokenState.java) and [Kotlin](https://github.com/corda/corda-training-code/blob/master/020-first-token/contracts/src/main/kotlin/com/template/states/TokenStateK.kt). In IntelliJ, you will need to import the [`020-first-token`](https://github.com/corda/corda-training-code/tree/master/020-first-token) project folder.

Let's review the work that was achieved here, and the rationales behind certain decisions. But first, a summary diagram of the `TokenState`:

![CDL view of TokenState](/first-code/cdl_tokenstate.png)

## The class declaration

<!-- TODO replace these pieces of code with the remote fetch components -->

```java
@BelongsToContract(TokenContract.class)
public final class TokenState implements ContractState {
```
You want your `TokenState` to be used as state in Corda, so it has to implement `ContractState`.

It's `final` because surprises are not always welcome.

<!-- TODO Further reasons? -->

A state's lifecycle is _controlled_ by the contract that will allow its creation and consumption. So it is important for you, the developer, to identify which contract the state expects for protection. This is the role of [`@BelongsToContract`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/contracts/BelongsToContract.kt#L21-L23). You will notice that:

```java
@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.CLASS)
annotation class BelongsToContract(val value: KClass<out Contract>)
```
The `BelongsToContract` annotation carries over at runtime, which allows the Corda system to cross-check whether it is instructed to use the expected contract when verifying a transaction.

Dig in to [`ContractState`](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/contracts/ContractState.kt#L16-L17) and see that this class is `@CordaSerializable`. Indeed, it is expected that a state needs to be serialized and transmitted over the wire to the relevant parties. It is thus important that all your fields are marked as serialisable as well.

## The fields

The state's fields are, hopefully, self-explanatory:

```java
@NotNull
private final Party issuer;
@NotNull
private final Party holder;
private final long quantity;
```

These 3 **keywords** will be found throughout the code so, let's talk about them a bit:

* `final`: because once a state has been created or loaded in memory, it is good to have assurance that it cannot be changed, even internally. Variables that change after they have potentially been checked is unwelcome. Also, the `equals` and `hashCode` functions would be defeated. Additionally remember that when a state has been created by way of a transaction it is, in effect, immutable. So it is best to express this inevitability.
* `private`: because you are best served protecting your attributes. If a value needs to be accessible, then you create a getter like this:

    ```java
    @NotNull
    public Party getIssuer() {
        return issuer;
    }
    ```
    Even though, in this example `Party` is an immutable type, having function getters allow for greater flexibility if you change internal parts of the `TokenState`, without having to refactor users of the state.
* `@NotNull`: so as to be warned by the compiler if you try to pass potentially `null` values.

Why pick the **names** of `issuer`, `holder` and `quantity`? Because, later on, you will encounter these same names again, in a specific Corda SDK. This should assist your understanding. If you picked different names, that is fine, as long as they are generic. For interoperability purposes, you will want to err on the side of generalisation. For example, `airline`, `passenger` and `miles` would be a little too specific.

What if:

* You had omitted the `issuer` field? It would mean that all airline miles are equal&nbsp;- that air-miles issued by one company are the same as (fungible with) air-miles issued by another company. It would mean that one rogue airline could issue air-miles and burden competitors with the liabilities and redemption.
* You had omitted the `holder` field? Did you plan on having this information stored elsewhere? What would a state without holder mean in this case?
* You had omitted the `quantity` field? Did you plan on issuing 1 state instance for each air-mile? It would not be very database-friendly to issue 5,000 times 1 air-mile for a single long trip.
* You named the numerical field `balance`? Did you mean that this would be the holder's full balance of tokens with the given issuer? That would be bad:
    * That would mean that each transaction discloses the holder's entire balance.
    * That would mean that while a transaction is being build in a flow with this one token, you, as the developer have to remember that it is in effect _soft-locked_. This means that if the holder starts another transaction with this same token, then 1 of these 2 transactions will fail, as double-spending is not allowed. It is likely to happen as flows may take time to complete if remote nodes are down, for instance.
    * That would mean that the holder cannot run multiple transactions in parallel.
* You had a 4th field? We are curious, let us know.

Why choose these **types**:

* `Party` as the identifiers of `issuer` and `holder`. Why not `AbstractParty`? A `Party` is clearly identified, on the other hand, if you choose `AbstractParty`, you make it possible in the future to use `AnonymousParty` and keep identities disclosed only to those that need to know. Eventually, you can imagine that the airlines consortium would most certainly accept to have anonymous `holder`. However, an anonymous `issuer` does not sound like an improvement. In the end, dealing with `AnonymousParty` is an advanced topic that is best left for later.
* `long` for the `quantity`? It allows large enough numbers for even the most enthusiastic traveler. It is best to use the greatest precision you will ever need.

## The constructor

```java
public TokenState(@NotNull final Party issuer, @NotNull final Party holder, final long quantity) {
    //noinspection ConstantConditions
    if (issuer == null) throw new NullPointerException("issuer cannot be null");
    ...
```
Notice:

* Even in the constructor, the variables are aggressively marked as `final`. You had no intention of modifying these variables within the constructor, right? Make this **explicit** by adding the `final` keyword.
* With `@NotNull` the constructor advertises that it expects non-null values, so that the expectation of non-null fields is carried forward to creators of the state.
* Despite the annotation, it is still possible to pass `null` values at **runtime**, so there needs to be a check for this possibility, which is the role of the `NullPointerException`. Yes, IntelliJ can automatically add the same at compilation time, but this is not the case when using Gradle, so let's not rely on a feature that is _only sometimes_ turned on.
* Next, checking `issuer` for nullity, when it has been previously annotated with `NotNull`, triggers a compiler&nbsp;/ static analysis warning. The role of `//noinspection ConstantConditions` is to disable this warning as the non-null check is made intentionally. The fewer unwelcome warnings, the better.
* `0` and negative values are allowed for `quantity`. Of course, the intention is not to let such negative-quantity states be created on the ledger. However, one of the design goals is to have all relevant constraints gathered in a single place, the contract, rather than scattered across constructors and other places.

## The participants

The participants is the list of parties that **have to** be informed of every change to the state. When informed of a change, these parties will also, by default, save the relevant states to their vaults. Of course other parties not mentioned in the participants can also be kept informed, if needed. This is addressed in the flows, as shall eventually be seen.

```java
@NotNull
@Override
public List<AbstractParty> getParticipants() {
    return Collections.singletonList(holder);
}
```
Why choose **only** the `holder`?

1. The `holder` is key. It is the owner and the owner **needs to know** what they own because of an issuance or a move, and when they no longer own because of a move or a redemption.
2. The `issuer` is not always relevant here. Does the issuer need to be informed of any change of ownership? No. The issuer is informed by default on issuance because they need to sign. And surely, the issuer needs to be informed when it is time to redeem. But in between, they **can let it go**, there is no necessity for them to be informed about every _move_.
3. An issuer will issue a lot of tokens, and expecting their servers to be pinged on every _move_ transaction is potentially putting them under a lot of pressure.

Notice the use of `Collections.singletonList`. It creates an immutable list. You cannot just `.add` elements to it. In effect, you lose some convenience. If you really mean to use this list of participants, and add to it in order to inform more parties than just the basic participants, then you will have to create a brand new list. There is a benefit hidden in this convolution: doing so makes your code **explicit** in its intent to inform more than the regular participants.

## Other functions

You already noted that all fields have getters. Also note that the `equals` and `hashCode` functions are here, for future convenience. These functions are another reason why you are well-advised to mark the fields `final`.

## [Tests](https://github.com/corda/corda-training-code/blob/master/020-first-token/contracts/src/test/java/com/template/states/TokenStateTests.java)

Some basic tests are performed on `TokenState`:

* Confirm the constructor does not accept `null` values.
* Confirm the constructor accepts negative quantities.
* Confirm the getter functions work as expected.
* Confirm the `equals` and `hashCode` functions work as expected.

Notice the use of `TestIdentity` which hides away the complexity of signing keys so you can focus on testing your code.

## [`TokenStateUtilities`](https://github.com/corda/corda-training-code/blob/master/020-first-token/contracts/src/main/java/com/template/states/TokenStateUtilities.java)

At first it does not look like you will need such a utility but it will come in handy in the contract. So let's reduce the mental load by looking at this utility now.

```java
public interface TokenStateUtilities {
```
The functions are declared in an `interface` as there is no need to instantiate this utility whose functions are meant to be `static`.

### The rationale

An air-mile issued by airline A is not fungible with an air-mile issued by airline B. They may share the underlying code and infrastructure but they are two different tokens. It is similar to what exists on foreign-exchange markets: although the USD and the EUR have similar properties, they are not the same.

So, given a list of token instances (species), you will have to tally the tokens of **each type**. In other words, the token sum per issuing airline. This is the purpose of this utility's first function.

### `mapSumByIssuer`

```java
static Map<Party, Long> mapSumByIssuer(@NotNull final Collection<TokenState> states) {
```
The return type `Map<Party, Long>` is the right structure to express a sum per issuing airline. Let's not forget that the `states` list contains more than 1 token instance of tokens issued by any given airline. So there needs to be a sum somewhere:

```java
    Math::addExact)));
```
With this function, you will be safe from `long` overflows originating from adding large numbers.

### `Stream`

Now, let's use streams, a feature of Java8 that you ought to get acquainted with. In short, a `Stream` is like a pipe where objects flow one after the other. If you took a `List` and _piped_ all its elements, they'd arrive one after the other, analogous to a stream. In fact, that's what this is doing:

```java
    states.stream()
```

In the middle of your stream you can do operations. The `Stream` interface declares convenience functions that allow you, for each _travelling_ object, to transform them, perform tests on them, act independently on each of them, and other actions.

At the end (as in the end of a sausage, not the end of a movie) of a stream, you can **collect** back the items and put them into lists, sets, maps and the like; provided your stream ends. This is what happens here:

```java
    .collect(Collectors.[...]
```
One of the advantages of streams compared to working on lists with loops is that you do not have to work with mutable lists and maps, but instead arrive at a result in fewer steps that express intent.

Streams will be used extensively in the next chapters.

### Collecting

It was already mentioned that the `states` list will likely have more than 1 token instance per issuer. This means you cannot rely on a straightforward map collector, which upon finding a new token will assume the key, a.k.a. the issuer, has never been seen before and will file the quantity as if the issuer was unique. Now, fortunately enough, there is the perfect collector for this purpose: a so-called **concurrent map**. This collector assists in filing multiple quantities per issuer:

```java
    .collect(Collectors.toConcurrentMap(
```
In order to achieve that, it needs some guidance, in particular:

1. To get the map key, given a token instance:

    ```java
    TokenState::getIssuer,
    ```
    This is a reference to the `getIssuer()` method of `TokenState`. You could of course instead write this lambda:

    ```java
    tokenState -> tokenState.getIssuer(),
    ```
    But the method reference avoids creating a new object (the lambda) on the heap every time `mapSumByIssuer` is called, which would eventually need garbage collection.
2. To get the map value, given a token instance:

    ```java
    TokenState::getQuantity,
    ```
    Same as for the key, this is the function reference.
3. To handle values with the same key, a.k.a. how to merge these values:

    ```java
    Math::addExact
    ```
    That's right, you want the sum, so the _merge_ is none other than the addition, protected from overflow.

Quite straightforward in hindsight:

```java
states.stream()
    .collect(Collectors.toConcurrentMap(
        TokenState::getIssuer, // The filing key.
        TokenState::getQuantity, // The value.
        Math::addExact)); // 2 values? No problem.
```
Let's add that the desire to return an immutable object is expressed with:

```java
return ImmutableMap.copyOf([...]
```
And that was `mapSumByIssuer`.

### [Tests](https://github.com/corda/corda-training-code/blob/master/020-first-token/contracts/src/test/java/com/template/states/TokenStateUtilitiesMapSumByIssuerTests.java)

As you would expect, the `mapSumByIssuer` function is tested for:

* That it works on an empty or singleton list.
* That it can sum when there are duplicate issuers.
* That it can file for different issuers.
* That it fails in case of overflow.
* That the returned map is immutable.

### In closing

Did you get most of it right?

And don't skip tests.
