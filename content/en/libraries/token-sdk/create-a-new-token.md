---
title: Create a new Token
description: Create something new with the Tokens SDK
slug: create-a-new-token
aliases: [
  "/libraries/create-car-token/"
]
menu:
  main:
    parent: token-sdk
    weight: 50  
weight: 50
---

{{<ExpansionPanel title="Code">}}

You may start this exercise by working from: https://github.com/corda/corda-training-code/tree/master/020-first-token

{{</ExpansionPanel>}}

In a previous chapter, you learned about the evolvable token type. You are going to use that knowledge here as part of learning about the Tokens SDK, by preparing a car token. Not only is this a preparation for the next exercise but also for the evolution of your project. The result of this exercise can be found [here](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/car/flow/CarTokenCourseExercise.java), but it is recommended that you do not peek until you have worked on your own.

In the next chapter, you will discover how to think about a "sale" in terms of flows, and atomicity.

## Exercise

You are going to advance step by step as per this list:

1. Create an evolvable car token type state.
2. Create an evolvable car token type contract.
3. Instantiate a BMW.
4. Issue the BWM to Alice as the holder.
5. Have the DMV change some parameters
6. Have Alice sell the car to Bob.
7. A note on UUID.
8. A note on observer nodes.
9. A note on the distribution list.

1 and 2 are class definitions, 3 to 6 are work you do in a flow, and unit test them. Here are 3 difficulty levels you can choose while proceeding through the exercise:

1. Harder: go ahead now and do it yourself with only the bullet points 1 to 6 above,
2. Medium: when the going gets tough, follow along below,
3. Rookie: when you want to see a solution, look over [here](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/car/flow/CarTokenCourseExercise.java).

### Evolvable `CarTokenType`

Ideally, you worked on your own before following along here.

Following the theory from the previous chapter, what parameters would you put in your [`CarTokenType`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/contracts/src/main/java/com/template/car/CarTokenType.java)? Feel free to add the ones you want. If you chose to work with Kotlin and made it a `data class`, well played. It will be more concise. Otherwise, here is the chosen fields, in Java:

```java
@BelongsToContract(CarTokenContract.class)
public class CarTokenType extends EvolvableTokenType {

    public static final int FRACTION_DIGITS = 0;
    @NotNull
    private final List<Party> maintainers;
    @NotNull
    private final UniqueIdentifier uniqueIdentifier;
    @NotNull
    private final String VIN;
    @NotNull
    private final String make;
    private final long mileage;
    private final long price;

    public CarTokenType(@NotNull final List<Party> maintainers, @NotNull final UniqueIdentifier uniqueIdentifier,
                        @NotNull final String VIN, @NotNull final String make,
                        final long mileage, final long price) {
        Validate.notNull(maintainers, "Maintainer cannot be empty.");
        Validate.notNull(uniqueIdentifier, "Unique identifier cannot be empty.");
        Validate.notBlank(VIN, "VIN cannot be empty.");
        Validate.notBlank(make, "Make cannot be empty.");
        Validate.isTrue(mileage >= 0, "Mileage cannot be negative.");
        Validate.isTrue(price > 0, "Price cannot be 0.");
        this.maintainers = maintainers;
        this.uniqueIdentifier = uniqueIdentifier;
        this.VIN = VIN;
        this.make = make;
        this.mileage = mileage;
        this.price = price;
    }

    @Override
    public int getFractionDigits() {
        return FRACTION_DIGITS;
    }

    @NotNull
    @Override
    public List<Party> getMaintainers() {
        return maintainers;
    }

    @NotNull
    @Override
    public UniqueIdentifier getLinearId() {
        return uniqueIdentifier;
    }

    @NotNull
    public String getVIN() {
        return VIN;
    }

    @NotNull
    public String getMake() {
        return make;
    }

    public long getMileage() {
        return mileage;
    }

    public long getPrice() {
        return price;
    }

    // We require `equals()` and `hashCode` to properly group Tokens, and also to be able to use
    // them in a HashMap.
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        final CarTokenType that = (CarTokenType) o;
        return getFractionDigits() == that.getFractionDigits() &&
                Double.compare(that.getMileage(), getMileage()) == 0 &&
                Double.compare(that.getPrice(), getPrice()) == 0 &&
                maintainers.equals(that.maintainers) &&
                uniqueIdentifier.equals(that.uniqueIdentifier) &&
                getVIN().equals(that.getVIN()) &&
                getMake().equals(that.getMake());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getFractionDigits(), maintainers, uniqueIdentifier, getVIN(), getMake(),
                getMileage(), getPrice());
    }
}
```
Why add `price` to it? After all, the price is not intrinsic to the car, it is instead an agreement between 2 parties making a trade. Later, when you are more at ease with Corda, you will take the price out of the car state. For now, let us imagine that the DMV wants to know the price of a car for tax reasons.

### Evolvable [`CarTokenContract`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/contracts/src/main/java/com/template/car/CarTokenContract.java)

Notice `BelongsToContract` above, so you need to create it. Before you look below, create it yourself and think about additional checks. It is good to know that the parent `EvolvableTokenContract` has already checked that there is a [single output](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/EvolvableTokenContract.kt#L47), and, when updating, a [single input](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/EvolvableTokenContract.kt#L72) too.

```java
public class CarTokenContract extends EvolvableTokenContract implements Contract {

    @Override
    public void additionalCreateChecks(@NotNull final LedgerTransaction tx) {
        final CarTokenType outputCarTokenType = tx.outputsOfType(CarTokenType.class).get(0);
        requireThat(require -> {
            // Validation rules on our fields.
            require.using("Mileage must start at 0.",
                    outputCarTokenType.getMileage() == 0L);
            require.using("Price cannot be 0.",
                    outputCarTokenType.getPrice() > 0L);
            return null;
        });
    }

    @Override
    public void additionalUpdateChecks(@NotNull final LedgerTransaction tx) {
        final CarTokenType inputCarTokenType = tx.inputsOfType(CarTokenType.class).get(0);
        final CarTokenType outputCarTokenType = tx.outputsOfType(CarTokenType.class).get(0);
        requireThat(require -> {
            // Validation rules on our fields.
            require.using("VIN cannot be updated.",
                    outputCarTokenType.getVIN().equals(inputCarTokenType.getVIN()));
            require.using("Make cannot be updated.",
                    outputCarTokenType.getMake().equals(inputCarTokenType.getMake()));
            require.using("Mileage cannot be decreased.",
                    outputCarTokenType.getMileage() >= inputCarTokenType.getMileage());
            require.using("Price cannot be 0.",
                    outputCarTokenType.getPrice() > 0L);
            return null;
        });
    }
}
```
The above should be self-explanatory.

### Instantiate a BMW

Now that the ledger classes have been defined, proceed to the flows and create the token of a specific brand new car, an instance of `CarTokenType`, on the node of the DMV. Because you are going to have the dealership eventually issue it, the dealership needs to know about the car. However, unless it was asked to instantiate this car by the dealership, the DMV has no knowledge of the dealership. So you have to pass explicitly the dealership as an observer of the transaction.

```java
// Department of Motor Vehicles is the maintainer.
final Party dmv = getServiceHub().getNetworkMapCache().getPeerByLegalName(
        CordaX500Name.parse("O=DMV, L=New York, C=US"));
final CarTokenType bmw = new CarTokenType(Collections.singletonList(dmv),
        new UniqueIdentifier(), "abc123", "BMW", 0L, 30_000L);
final TransactionState bmwTxState = new TransactionState(bmw, notary);
// Identify the future issuer.
final Party bmwDealer = getServiceHub().getNetworkMapCache().getPeerByLegalName(
        CordaX500Name.parse("O=BMW Dealership, L=New York, C=US"));
final SignedTransaction bmwTx = subFlow(new CreateEvolvableTokens(
        bmwTxState, Collections.singletonList(bmwDealer));
final StateAndRef<CarTokenType> bmwStateAndRef = bmwTx
        .outRefsOfType(CarTokenType.class).get(0);
```
The code above is rootless, and in effect split into 3 parts. To see it in context:

1. The wrapping flow defined here: [`IssueCarTokenTypeFlow`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/main/java/com/template/car/flow/IssueCarTokenTypeFlow.java).
2. Its usage with specific values and nodes in the unit test class: [`createNewBmw()`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/car/flow/CarTokenCourseExercise.java#L61-L71).
3. Its output confirmation in the unit test proper: [`@Test isCreated()`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/car/flow/CarTokenCourseExercise.java#L110-L117).

You must think that the `IssueCarTokenTypeFlow` flow is not particularly useful, and that would be right as it really just does minimal actions prior to launching [`CreateEvolvableTokens`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/main/java/com/template/car/flow/IssueCarTokenTypeFlow.java#L49) proper. Although, it provides a sense of what to expect when working with meaningful flows.

### Issue the BMW to Alice as the holder

Now that you have your token type, and the dealership has been informed, move to the node of the dealership. Note that you do not need to pass Alice as an observer as this is already taken care of by the sub flow (see distribution list lower down). You use the variable `bmw`, which was defined higher up on the DMV node, so the unspoken reality is that you would need to have saved that somewhere or fetched and created it again to make it available on the dealership node (see the UUID heading below).

```java
final TokenPointer<CarTokenType> bmwPointer = bmw.toPointer(CarTokenType.class);
// Identify the issuer.
final Party bmwDealer = getServiceHub().getNetworkMapCache().getPeerByLegalName(
        CordaX500Name.parse("O=BMW Dealership, L=New York, C=US"));
final IssuedTokenType bmwWithDealership = new IssuedTokenType(bmwDealer, bmwPointer);
// Create a unique car.
final NonFungibleToken alicesCar = new NonFungibleToken(bmwWithDealership, alice, new UniqueIdentifier(), null);
// Issue car to Alice.
subFlow(new IssueTokens(Collections.singletonList(alicesCar)));
```
Again, the code above is rootless, and again split into 3 parts:

1. The wrapping flow: [`IssueCarToHolderFlow`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/main/java/com/template/car/flow/IssueCarToHolderFlow.java), which needs to be passed information that came from the DMV.
2. Its usage with specific values: [`issueCarTo()`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/car/flow/CarTokenCourseExercise.java#L74-L82).
3. Its output confirmation in the unit test proper: [`@Test isIssuedToAlice()`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/car/flow/CarTokenCourseExercise.java#L120-L139).

You will notice that the unit test is getting longer as it indeed has to do some preparation to be able to test the interesting part.

### Have the DMV change some parameters

After the car has been issued, some time has passed, and Alice is planning to sell her car to Bob. She needs the DMV to update the mileage and the price. Again, you use `bmw` and `bmwStateAndRef`, which were defined higher up, here again, you keep track or fetch those again. Alice also needs to be informed of the change, which, at the time of writing does not happen automatically. To run from the DMV's node:

```java
// Update the car mileage and price.
final CarTokenType updatedBmw = new CarTokenType(bmw.getMaintainers(), bmw.getLinearId(),
        bmw.getVIN(), bmw.getMake(), 8_000L, 22_000L);
final SignedTransaction updatedCarTokenTypeStateAndRef = subFlow(new UpdateEvolvableToken(
        bmwStateAndRef, updatedBmw, Collections.singletonList(alice)));
```
Which, in this case, is split into 3 parts:

1. The wrapping flow: [`UpdateCarTokenTypeFlow`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/main/java/com/template/car/flow/UpdateCarTokenTypeFlow.java).
2. Its specific usage: [`updateMileageOn()`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/car/flow/CarTokenCourseExercise.java#L85-L94).
3. Its output confirmation in the unit test proper: [`@Test isIssuedThenUpdated()`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/car/flow/CarTokenCourseExercise.java#L142-L166), which confirms that Alice did not automatically get the update.

### Sell the car to Bob

Now that the car has been issued and the token updated, it is time to sell the car to Bob. This is rather simple, given the previous information, which again, in this rootless code, is supposed to be travelling from one node to the other:

```java
// Sell the car to Bob.
final TokenPointer<CarTokenType> updatedBmwPointer = updatedBmw.toPointer(CarTokenType.class);
final PartyAndToken bobAndBmw = new PartyAndToken(bob, updatedBmwPointer);
subFlow(new MoveNonFungibleTokens(bobAndBmw, Collections.emptyList()));
```
In practice, you split it into 3:

1. The wrapping flow: [`MoveCarToNewHolderFlow`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/main/java/com/template/car/flow/MoveCarToNewHolderFlow.java).
2. Its specific usage: [`moveCarTo()`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/car/flow/CarTokenCourseExercise.java#L97-L107).
3. Its output confirmation: [`@Test isIssuedUpdatedAndSoldToBob()`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/car/flow/CarTokenCourseExercise.java#L169-L197).

The 4 create, issue, update and move steps demonstrate what can be done in flows with the car token type and non-fungible token. Let's discuss a bit about the reality of working with tokens.

### Via UUID

The above example breezily overlooks the fact that variables created on a node, say the DMV node, are readily available on Alice's node. In practice, Alice would have to have been updated by whoever did the change, and then Alice would have to:

1. Go and fetch the updated token type from her vault. The identifying key there would be the UUID of the `CarTokenType` instance.
2. Go and fetch the `NonFungibleToken` of her car in the vault. Its identifying key is also a UUID.

Whether this is for an `issue`, `move`, or `redeem` flow, it would likely look like:

1. Using `QueryCriteria`:

    ```java
    final UUID uuid = UUID.fromString("theUUID");
    final QueryCriteria uuidCriteria = new QueryCriteria.LinearStateQueryCriteria()
            .withUuid(Collections.singletonList(uuid));
    final List<StateAndRef<CarTokenType>> queryResult = getServiceHub().getVaultService()
            .queryBy(CarTokenType.class, uuidCriteria)
            .getStates();
    // Alice should get one result in the list, your latest CarTokenType is in it.
    ```
    See [`@Test canAccessByUUIDAndQuery()`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/car/flow/CarTokenCourseExercise.java#L200-L227) for the example.
2. Or using a `LinearPointer`:

    ```java
    final UUID uuid = UUID.fromString("theUUID");
    final StateAndRef<CarTokenType> carTokenTypeState = new LinearPointer<>(
            UniqueIdentifier.Companion.fromString(bmwId),
            CarTokenType.class,
            false)
            .resolve(alice.getServices());
    ```
    See [`@Test canAccessByUUIDAndPointer()`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/car/flow/CarTokenCourseExercise.java#L230-L255) for the example.

### Observer nodes

All the flows that come with the SDK accept a list of observer nodes.

Observer nodes are parties which are not participants in the state but want to be aware of what's happening in your network (e.g. auditors or regulators that require read-only access); so when the transaction gets finalized, it gets recorded in the participants and the observer nodes. The SDK also provides `ObserverAwareFinalityFlow` for the same purpose.

The examples above use the observer nodes facility where it is deemed necessary, in the case of:

* The DMV informing the dealership that the `CarTokenType` instance has been created, so that the dealership can issue the car.
* The DMV informing Alice that her `CarTokenType` instance has been updated, so that Alice can sell her updated car.

### The distribution list

Because of the disconnect between the evolvable token type and its _associated_ non fungible token, either one risks being modified without the parties interested in the other be notified too. The distribution list mechanism palliates this, by placing the onus on the flow developer. Whenever a change in ownership happens, the following needs to occur:

```java
subFlow(new UpdateDistributionListFlow(fullySignedTx));
```
This flow is `@InitiatingFlow`, so it is fire-and-forget. In the future, there will be more situations during which calling this flow solves the informating issues.

## Some Tips

1. When you extend `TokenType` or `EvolvableTokenType`, you **must** override the `equals()` method. If you don't, you get a [`There is a token group with no assigned command`](https://github.com/corda/token-sdk/blob/b9a1ee76434defd0b234df05c972202c7f1a2a5c/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/AbstractTokenContract.kt#L119) exception. That's because the SDK flows attempt to group the tokens (i.e. transaction inputs / outputs) by `IssuedTokenType` in order to assign the correct command to each token group, which in turn allows running the correct validation contract. You must also override `hashCode()`, [see here why](https://stackoverflow.com/questions/2265503/why-do-i-need-to-override-the-equals-and-hashcode-methods-in-java). By the way, IntelliJ can generate both methods for you from the menu: <kbd>Code</kbd> -> <kbd>Generate…</kbd> -> <kbd>equals() and hashCode()</kbd>.

2. Quantities inside tokens are in the smallest denomination. For instance, the USD token type has 2 fraction digits (i.e. 0.01 -which is one cent- is usually the smallest denomination). So, if you create a `FungibleToken` of type USD and quantity 100, that 100 is considered (by the SDK) in the smallest denomination (i.e. the cent). So you’re issuing 100 cents not 100 dollars!

    Another example, if your token type has 6 fraction digits, to issue “1” token of that type, you need to pass a quantity of 1,000,000, because the smallest denomination is 0.000,001, where 1,000,000 x 0.000,001 = 1. As you can imagine, this could become inconvenient and very confusing for the end user. To issue &#36;100 do you have to ask the user to pass 10,000? That’s why the SDK comes with the [`AmountUtilitiesKt` class](https://github.com/corda/token-sdk/blob/master/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/utilities/AmountUtilities.kt) that takes the number that you actually want, say &#36;100, and converts it to the quantity that represents it in your token type, i.e changes &#36;100 to 10,000 cents. This way you don’t have to think about the conversion “rate”, and you can make your flows easier to use by accepting as input parameter the friendly number (&#36;100) and converting it to the correct quantity (integer representing the smallest possible unit) inside the flow:

    ```java
    final TokenType dollarType = FiatCurrency.Companion.getInstance("USD");
    final Amount<TokenType> dollarAmount = AmountUtilitiesKt.amount(100, dollarType);
    // dollarAmount.getQuantity() == 10,000 cents; which represents 100$
    ```

3. While on the subject of quantity, the Tokens SDK uses the `Amount` class to represent a token amount. The `Amount` class has a property called `quantity` of type `long`, and the biggest number that a `long` can hold is 2<sup>63</sup>-1 = 9223372036854775807 which is 19 digits long. This means that if you have an ETH (Ethereum) token type, the largest number that you can represent is ~9.2 Ether. Indeed, the smallest Ether denomination is the Wei where 1 Ether = 1 x 10<sup>18</sup> Wei. So that’s one limitation that you’d have to overcome if you wanted to represent Ether in Corda. See [the test](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/usd/CurrencyLearningTest.java#L17-L29):

    ```java
    @Test(expected = ArithmeticException.class)
    public void cannotRepresentTenEth() {
        final TokenType etherType = DigitalCurrency.Companion.getInstance("ETH");
        final Amount<TokenType> oneEther = AmountUtilitiesKt.amount(1, etherType);

        // One Ether in Wei is 19 digits long.
        assertEquals(19, String.valueOf(oneEther.getQuantity()).length());
        // 19 is also the maximum number of digits that a "long" can hold!
        assertEquals(19, String.valueOf(Long.MAX_VALUE).length());

        // Now let's try to create 10 Ether,
        // which in Wei is 20 digits long and cannot be represented by "long" type.
        AmountUtilitiesKt.amount(10, etherType);
    }
    ```

4. When you query the vault for tokens, remember that you might get more than 200 records; so make sure that you are using [pagination](https://docs.corda.net/api-vault-query.html#pagination).

5. If you are querying the vault to calculate a balance, remember that the returned quantity is in the smallest denomination. So if the returned total is 10,000 (taking using USD token type as an example), then the actual balance is 100&#36;.

6. Remember when you query for a balance to always filter by token type and by issuer, because as mentioned earlier, tokens with the same token type but different issuers (remember airlines?) are considered different. [`QueryUtilities`](https://github.com/corda/token-sdk/blob/master/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/utilities/QueryUtilities.kt) has a lot of useful functions that will make your life easier, including a function to calculate the balance for a certain token type and issuer: `VaultService.tokenBalanceForIssuer`:

    ```java
    final QueryCriteria queryCriteria = QueryUtilitiesKt
            // Specify token type and issuer.
           .tokenAmountWithIssuerCriteria(vaultService, tokenTypePointer, issuer)
           // Group by token type and aggregate.
           .and(QueryUtilitiesKt.sumTokenCriteria());
    final Vault.Page<FungibleToken> results = proxy.vaultQueryByCriteria(queryCriteria, FungibleToken.class);
    final Amount<TokenType> totalBalance = QueryUtilitiesKt.rowsToAmount(tokenTypePointer, results);
    ```

7. It is advisable to hardcode your notary (using its X500 name). The Tokens SDK facilitates that by allowing you to set that value (e.g. `notary=”O=Notary,L=London,C=GB”`) in the configuration file of the `tokens-workflows` CorDapp. Then you can fetch that notary using `getPreferredNotary(serviceHub)`. You can see here how to [setup a configuration file for a CorDapp](https://blog.b9lab.com/how-to-create-a-cordapp-configuration-file-ef79581b9e3-ef79581b9e3c), [official docs](https://docs.corda.net/head/cordapp-build-systems.html#cordapp-configuration-files).

8. [In-memory token selection](https://github.com/corda/token-sdk/blob/master/docs/InMemoryTokenSelection.md) is an experimental feature that was introduced to remove potential performance issues that database token selection might introduce. You can configure it to group the tokens (i.e. index them) by token type, public key of the holder, or UUID (i.e. by account when using Accounts library). Currently all flows that are provided by the SDK (i.e. issue, move, and redeem) use database token selection by default; so in order to use in-memory selection you must write your own versions of the flows relying on the previously demonstrated utility functions, say `addMoveTokens()`, and `localTokenSelector.selectStates()`.

9. At the time of writing, with Tokens SDK V1.1, in-memory token selection is enabled by default. To disable it, you must add a custom configuration file for the `tokens-selection` CorDapp with the below lines:

    ```
    stateSelection.inMemory.enabled = false
    # You will still get warning messages in your log file
    # regarding the below 2 parameters not being set, even when
    # in-memory selection is disabled; that's why they are set here.
    stateSelection.inMemory.indexingStrategies = ["EXTERNAL_ID"]
    stateSelection.inMemory.cacheSize = 1024
    ```

10. It is advisable to use `BigDecimal` for monetary calculations; you can read why [here](https://dzone.com/articles/never-use-float-and-double-for-monetary-calculatio). As a side note, never use the "`double`" constructor of `BigDecimal` to create an instance based of a double value (e.g. `BigDecimal doubleValue = new BigDecimal(0.01)`) as it will lead to [unpredictable results](https://docs.oracle.com/javase/8/docs/api/java/math/BigDecimal.html#BigDecimal-double-). Either use the “`String`” constructor (e.g. `BigDecimal doubleValue = new BigDecimal("0.01")`) or, even better, always use `valueOf()`, e.g. `BigDecimal doubleValue = BigDecimal.valueOf(0.01)`. Also, when you divide 2 `BigDecimal` instances, always specify the `MathContext`, i.e. precision and [rounding mode](https://docs.oracle.com/javase/7/docs/api/java/math/MathContext.html).

## Conclusion

In this chapter, you have reviewed the `EvolvableTokenType`, its contract, example flows, and related considerations. You have seen what a car sale would look like. Or have you? Let's see what hasn't been presented yet in the next chapter.

