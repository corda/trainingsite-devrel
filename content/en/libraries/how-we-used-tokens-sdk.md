---
title: Refactor Solution
description: Example project using the token SDK
slug: how-we-used-tokens-sdk
menu:
  main:
    parent: libraries
    weight: 50  
weight: 50
---


You will get the most from this example if you compare to your own attempt. Did you refactor your project to use the SDK? Compare this example to your attempt. The code can be found [here](https://github.com/corda/corda-training-code/tree/master/030-tokens-sdk), and in IntelliJ, you need to import the [`030-tokens-sdk`](https://github.com/corda/corda-training-code/tree/master/030-tokens-sdk) folder as a project.

You will notice more than bland replacements. There are some extra learning nuggets in here.

## [`constants.properties`](https://github.com/corda/corda-training-code/blob/master/constants.properties) & [`build.gradle`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/build.gradle)

In the constants, notice the versions that will be used:

```properties
tokensReleaseVersion=1.1
tokensReleaseGroup=com.r3.corda.lib.tokens
confidentialIdReleaseVersion=1.0
confidentialIdReleaseGroup=com.r3.corda.lib.ci
```
The [`FungibleToken`](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/states/FungibleToken.kt#L36) takes an [`AbstractParty holder`](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/states/FungibleToken.kt#L38), and the flows can handle anonymous parties, so the [confidential app](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/build.gradle#L67) is added as well.

There are 3 `build.gradle` files:

* The [root one](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/build.gradle):
    * Where you add the constants definition in [`buildscript.ext`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/build.gradle#L22-L25):

        ```groovy
        tokens_release_version = constants.getProperty("tokensReleaseVersion")
        tokens_release_group = constants.getProperty("tokensReleaseGroup")
        confidential_id_release_version = constants.getProperty("confidentialIdReleaseVersion")
        confidential_id_release_group = constants.getProperty("confidentialIdReleaseGroup")
        ```

    * The [`dependencies`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/build.gradle#L103-L107):

        ```groovy
        // Token SDK dependencies.
        cordapp "$confidential_id_release_group:ci-workflows:$confidential_id_release_version"
        cordapp "$tokens_release_group:tokens-contracts:$tokens_release_version"
        cordapp "$tokens_release_group:tokens-workflows:$tokens_release_version"
        cordapp "$tokens_release_group:tokens-money:$tokens_release_version"
        cordapp "$tokens_release_group:tokens-selection:$tokens_release_version"
        ```
    * For completeness, the [`deployNodes.nodeDefaults`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/build.gradle#L139-L143):

        ```groovy
        cordapp project(':contracts')
        cordapp (project(':workflows')) {
            config project.file("res/tokens-workflows.conf") // About this in an moment
        }
        // Token SDK dependencies.
        cordapp "$confidential_id_release_group:ci-workflows:$confidential_id_release_version"
        cordapp "$tokens_release_group:tokens-contracts:$tokens_release_version"
        cordapp "$tokens_release_group:tokens-workflows:$tokens_release_version"
        cordapp "$tokens_release_group:tokens-money:$tokens_release_version"
        cordapp "$tokens_release_group:tokens-selection:$tokens_release_version"
        ```
    * Explicitly [clear](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/build.gradle#L157) the notary `node`:

        ```groovy
        cordapps.clear()
        ```
* [For contracts](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/contracts/build.gradle), only the [`dependencies`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/contracts/build.gradle#L46-L47) need updating:

    ```groovy
    cordapp "$tokens_release_group:tokens-contracts:$tokens_release_version"
    cordapp "$tokens_release_group:tokens-money:$tokens_release_version"
    ```
* [For workflows](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/build.gradle), also only [`dependencies`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/build.gradle#L69-L71):

    ```groovy
    cordapp "$confidential_id_release_group:ci-workflows:$confidential_id_release_version"
    cordapp "$tokens_release_group:tokens-workflows:$tokens_release_version"
    cordapp "$tokens_release_group:tokens-selection:$tokens_release_version"
    ```

## The [air-mile type](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/contracts/src/main/java/com/template/states/AirMileType.java)

The first decision is how to agree on a common `TokenType` for the air-mile. Remember, this is not the issued type, it is the base type. The first idea that will work is to do something like:

```java
public final class AirMileType extends TokenType {

    public static final String IDENTIFIER = "AIR";
    public static final int FRACTION_DIGITS = 0;

    public static TokenType create() {
        return new TokenType(IDENTIFIER, FRACTION_DIGITS);
    }
}
```
Why use a static constructor and not make it a proper class? Good question. This is to avoid having to handle complications surrounding `FungibleToken`. Skipped is the _detail_ that the `FungibleToken` constructor wants the [hash of the JAR](https://github.com/corda/token-sdk/blob/1.1/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/states/FungibleToken.kt#L38) file that hosts your token type. With the `static` constructor, lazily doing:

```java
new FungibleToken(amount, alice, null)
```
This will work without issue. However, you should not be completely satisfied  with this half-way measure. Instead, while waiting for [`@JvmOverloads`](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/states/FungibleToken.kt#L36-L39) to make it into a release, you can be explicit about the jar hash:

```java
public final class AirMileType extends TokenType {

    public static final String IDENTIFIER = "AIR";
    public static final int FRACTION_DIGITS = 0;

    @NotNull
    public static SecureHash getContractAttachment() {
        //noinspection ConstantConditions
        return TransactionUtilitiesKt.getAttachmentIdForGenericParam(new AirMileType());
    }

    public AirMileType() {
        super(IDENTIFIER, FRACTION_DIGITS);
    }

    @Override
    public boolean equals(final Object o) {
        if (this == o) return true;
        return o != null && getClass() == o.getClass();
    }

    @Override
    public int hashCode() {
        return Objects.hash("AirMileType");
    }
}
```
Of course, do not forget the `hashCode` and `equals` functions that ensure an `AirMileType` instance is no different from another. This `getContractAttachment()` function is the one you will need to use when instantiating `FungibleToken`s.

You will notice a [`DummyContract`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/contracts/src/main/java/com/template/contracts/DummyContract.java), to satisfy the basics of a "Contracts" CorDapp.

## The [contract _learning_ tests](https://github.com/corda/corda-training-code/tree/master/030-tokens-sdk/contracts/src/test/java/com/template/contracts)

The previous tests on `TokenContract` are no longer needed.

{{<HighlightBox type="tip">}}

The point here isn't to create unit tests on the SDK's contracts. Those belong to the SDK's repo itself. However, unit tests not only confirm features and detect regressions, they also describe how to use your code, in this case, how to create transactions with `AirMileType`.

{{</HighlightBox>}}

If you compare with the tests you created earlier, you had to make the following adjustments.

### Setting up the mocks

It got a wee bit more involved. [Explicitly add](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/contracts/src/test/java/com/template/contracts/TokenContractIssueTests.java#L22) the tokens contracts:

```java
private final MockServices ledgerServices = new MockServices(Collections.singletonList("com.r3.corda.lib.tokens.contracts"));
```

### Declutter

Since there are a few more steps in order to create a `FungibleToken`, `IssuedTokenType`s are pre-created:

```java
private final IssuedTokenType aliceMile = new IssuedTokenType(alice, new AirMileType());
private final IssuedTokenType carlyMile = new IssuedTokenType(carly, new AirMileType());
```
And a function to [encapsulate](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/contracts/src/test/java/com/template/contracts/TokenContractTestHelpers.java#L11-L17) some complexity:

```java
@NotNull
private FungibleToken create(
        @NotNull final IssuedTokenType tokenType,
        @NotNull final Party holder,
        final long quantity) {
    return new FungibleToken(new Amount<>(quantity, tokenType), holder, AirMileType.getContractAttachment());
}
```
Notice the use of the [`AirMileType.getContractAttachment()`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/contracts/src/test/java/com/template/contracts/TokenContractIssueTests.java#L36) argument.

### The attachment

Because the Jar hash is specified for `AirMileType`, the attachment itself is pretend-added, which is why you see this new line repeated in each test:

```java
tx.attachment("com.template.contracts", AirMileType.getContractAttachment());
```
And in order to confirm that this is indeed necessary, an added test `@Test transactionMustIncludeTheAttachment()`.

### [`tx.tweak`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/contracts/src/test/java/com/template/contracts/TokenContractIssueTests.java#L47)?

Oh yes, now is a good time to learn this technique. It clones the `tx` and gives you the copy inside the argument lambda. With this copy, you can perform some extra tests, and when you exit the lambda, you are back to the previous transaction. A good use case is to make sure you are testing what you think you are testing. You see, when you run the following (pseudo-code) test:

```java
tx.input(a, b);
tx.command(c, d);
tx.failsWith("bad, try again");
```
Did you 100% check that only the input was wrong? Or was it the command? Or both? Or was it `a`, `b`, `c` or `d` or a combination of them? Something else? In comes `tweak` where you can make sure it is `d` in the command that is wrong:

```java
tx.input(a, b);
tx.tweak(txCopy -> {
    txCopy.command(c, d); // <- txCopy!
    txCopy.failsWith("bad, try again");
    return null;
});
// At this point, tx has no knowledge of what happened inside tweak.
tx.command(c, e); // <- tx, and we changed only d to e
tx.verifies();
```
Isn't it now obvious that it was `d` in the command that was the problem? Since having `e` as the only difference made the transaction verify, and the 2 are a few lines apart; even fewer if you are using Kotlin.

{{<HighlightBox type="tip">}}

Thanks to `tweak` you have a high assurance that the error you thought you tested is what you tested indeed. Having it all in a single test is more encapsulated than having 2 individual tests testing both scenarios. Those 2 individual tests might be modified independently by a developer who may not fully grasp the connection between the 2.

{{</HighlightBox>}}

### Multiple issuers

The old `TokenContract` allowed token issuance from multiple issuers with a single command:

```java
tx.command(Arrays.asList(alice.getOwningKey(), carly.getOwningKey()), new TokenContract.Commands.Issue());
```
With the Tokens SDK, you can still issue from multiple issuers, although you have to add [1 command per issuer]((https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/contracts/src/test/java/com/template/contracts/TokenContractIssueTests.java#L163-L164)):

```java
tx.command(alice.getOwningKey(), new IssueTokenCommand(aliceMile, Arrays.asList(0, 1, 2)));
tx.command(carly.getOwningKey(), new IssueTokenCommand(carlyMile, Arrays.asList(3, 4)));
```
The same concept applies for [move](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/contracts/src/test/java/com/template/contracts/TokenContractMoveTests.java#L331-L336) and [redeem](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/contracts/src/test/java/com/template/contracts/TokenContractRedeemTests.java#L225-L230).

### `0` in input quantity?

In `TokenContract`, quantity `0` is prevented in all situations. However, the Tokens SDK [allows this situation in inputs](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/contracts/src/test/java/com/template/contracts/TokenContractMoveTests.java#L111) only. The rationale being that you may want to mop up bad states, which are still impossible to create. So you have to change your tests to accommodate for this change of specification: `@Test inputsMayHaveAZeroQuantity()`.

### Redeem with outputs?

Here too the specifications have changed, and tests need to reflect that: [`@Test redeemTransactionMustHaveLessInOutputs()`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/contracts/src/test/java/com/template/contracts/TokenContractRedeemTests.java#L63). The outputs are understood as the _change_ (as in "Do you have _change_ for a &#36;20 bill?") given when redeeming states with a quantity larger than desired. Remember the `RedeemFlows.SimpleInitiator`? It did a move transaction, in order to reorganize the states, before a redeem if the collected quantity was too high. Here, with the _change_ mechanism, the Tokens SDK allows for a single redeem transaction. This requires some attention but is on the whole more elegant.

## The [flows](https://github.com/corda/corda-training-code/tree/master/030-tokens-sdk/workflows/src/main/java/com/template/flows)

### Config file

Do you remember the preferred notary? It was hard-coded. Now there is new a configuration file in [`res/tokens-workflow.conf`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/res/tokens-workflows.conf). This is the file that `deployNodes.nodeDefaults` is instructed to pick when setting up the Tokens CorDapp. It only contains:

```
notary="O=App Notary,L=London,C=GB"
```

### `@Initiating` and `@InitiatedBy`

First thing you will notice is that the responder flows are removed. Each refactored flow is only doing local actions before calling `subFlow`, **once**, on an existing flow of the Tokens SDK. So the responding actions are already defined. In detail:

1. The [`IssueFlows.Initiator`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/main/java/com/template/flows/IssueFlows.java#L33):
    * [Sub-flows](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/main/java/com/template/flows/IssueFlows.java#L97) `IssueTokens`, which has its auto-initiated handler: `IssueTokensHandler`.
    * Therefore does not need to be `@Initiating`.
2. The [`MoveFlows.Initiator`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/main/java/com/template/flows/MoveFlows.java#L33):
    * [Sub-flows](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/main/java/com/template/flows/MoveFlows.java#L109) `AbstractMoveTokensFlow`, which is not `@Initiating` and has the `MoveTokensFlowHandler`.
    * Therefore needs to be `@Initiating`.
    * Because it will be used in tests only, it will be registered for auto-initiation in tests only.
3. The [`RedeemFlows.Initiator`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/main/java/com/template/flows/RedeemFlows.java#L28):
    * [Sub-flows](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/main/java/com/template/flows/RedeemFlows.java#L77) `RedeemTokensFlow`, which is not `@Initiating` and has the `RedeemTokensFlowHandler`.
    * Therefore needs to be `@Initiating`.
    * Because it will be used in tests only, it will be registered for auto-initiation in tests only.

### Multiple signatures

1. The `IssueFlows` was configured to issue from a single issuer. This is also what `IssueTokens` does, so no big change here.
2. The `MoveFlows` was ready to move tokens from multiple holders. However, `AbstractMoveTokensFlow` does not allow that, so you have to restrict `MoveFlows` to accommodate this. Of course, you can write a more complex flow for multiple holders, but as mentioned earlier, this is a potentially dangerous route, so that is left for a later chapter when a flow wants to do more than just move tokens.
3. The `RedeemFlows` was ready to redeem tokens from multiple holders and issuers. However, here too, it is limited by the sub flows it calls and it is ok.

### `progressTracker`

Alas, the SDK flows do not make it easy to pass a progress tracker, so it sort of drops the ball here, hoping a future version will accommodate this. Except on `MoveFlows.Initiator` where you can override the getter on `AbstractMoveTokensFlow`.

## [Flow tests](https://github.com/corda/corda-training-code/tree/master/030-tokens-sdk/workflows/src/test/java/com/template/flows)

### Setting up the mocks

There was some work here:

1. You want to include all of your CorDapps, hence the [long list](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/flows/FlowTestHelpers.java#L33-L40) of `TestCordapp.findCordapp`.
2. You want to reuse the configuration file, instead of having the hard-coded preferred notary, which explains the [`getPropertiesFromConf`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/flows/FlowTestHelpers.java#L44) and [`removeQuotes`](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/flows/FlowTestHelpers.java#L55) functions (which are not so important for the overall learning here) to arrive at:

    ```java
    final Map<String, String> tokensConfig = getPropertiesFromConf("res/tokens-workflows.conf");
    ```
    which is [used in](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/flows/FlowTestHelpers.java#L36):

    ```java
    TestCordapp.findCordapp("com.r3.corda.lib.tokens.workflows")
                                .withConfig(tokensConfig)
    ```
    and in [preparing the notaries](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/flows/FlowTestHelpers.java#L32). Notice the [added notary](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/flows/FlowTestHelpers.java#L31), to be able to test that it [gets the preferred one](https://github.com/corda/corda-training-code/blob/master/030-tokens-sdk/workflows/src/test/java/com/template/flows/IssueFlowsTests.java#L48-L56), and not just the first in the list:

    ```java
    .withNotarySpecs(ImmutableList.of(
            new MockNetworkNotarySpec(CordaX500Name.parse("O=Unwanted Notary, L=London, C=GB")),
            new MockNetworkNotarySpec(CordaX500Name.parse(tokensConfig.get("notary")))))
    ```

### The attachment?

This is taken care of by the sub flows it calls, so all good.

### Refactor

Only a few changes were made such that it tests only what the flows can do, as explained above.

## Conclusion

You have reviewed the example refactor, what was added, what was removed, and you learned about `tx.tweak` in the process. You have had your first glimpse at a CorDapp configuration file. Why go through the trouble of using someone else's work when you had a perfectly fine `TokenState`? Well, with this `AirMileType`, its `FungibleToken`s and flows, you will be speaking the _same language_ as other CorDapps, which facilitates interoperability.

Time to move on to `EvolvableTokenType` and `NonFungibleToken`s.
