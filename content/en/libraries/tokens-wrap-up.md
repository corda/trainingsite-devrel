---
title: Tokens Wrap-Up
description: Recap and reflection
slug: tokens-wrap-up
menu:
  main:
    parent: libraries
    weight: 90  
weight: 90
---

It feels like you have gone through the Tokens SDK extensively. Before moving on, let's recap a bit and cover disparate connected topics.

## Classes you learned about

### Currency

To create `TokenType` instances of the most common Fiat and Digital currencies:

* [`Currency`](https://docs.oracle.com/javase/8/docs/api/java/util/Currency.html)
* [`FiatCurrency`](https://github.com/corda/token-sdk/blob/master/modules/money/src/main/kotlin/com/r3/corda/lib/tokens/money/FiatCurrency.kt)
* [`DigitalCurrency`](https://github.com/corda/token-sdk/blob/master/modules/money/src/main/kotlin/com/r3/corda/lib/tokens/money/DigitalCurrency.kt)

### Types

Those classes form the nucleus of your tokens:

* [`TokenType`](https://github.com/corda/token-sdk/blob/master/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/types/TokenType.kt)
* [`IssuedTokenType`](https://github.com/corda/token-sdk/blob/master/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/types/IssuedTokenType.kt)
* [`PartyAndAmount`](https://github.com/corda/token-sdk/blob/master/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/types/PartyAndAmount.kt), a useful class when, for instance, you want to move a token `Amount` to a certain `Party`.
* [`TokenPointer`](https://github.com/corda/token-sdk/blob/master/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/types/TokenPointer.kt), an integral part of the `EvolvableTokenType`.

### States

Token classes:

* [`FungibleToken`](https://github.com/corda/token-sdk/blob/master/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/states/FungibleToken.kt)
* [`NonFungibleToken`](https://github.com/corda/token-sdk/blob/master/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/states/NonFungibleToken.kt)
* [`EvolvableTokenType`](https://github.com/corda/token-sdk/blob/master/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/states/EvolvableTokenType.kt): a more complex linear state to represent a token type that can change over time, unlike `TokenType`.

### Schemas

So far, you accessed the vault and queried it without further explanation, although all those actions should have made sense in a high-level sense. Explanations come later. On the other hand, if you want, you can explore those custom schemas so as to give you an idea of what attributes are available for `VaultCustomQueryCriteria`:

* [`FungibleTokenSchemaV1`](https://github.com/corda/token-sdk/blob/master/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/internal/schemas/FungibleTokenSchema.kt)
* [`NonFungibleTokenSchemaV1`](https://github.com/corda/token-sdk/blob/master/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/internal/schemas/NonFungibleTokenSchema.kt)

### Flows

Probably the most important part of the SDK. Those flows also come in a combination of other flavors, confidential, non-fungible:

* [`IssueTokensFlow`](https://github.com/corda/token-sdk/blob/master/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/issue/IssueTokensFlow.kt)
* [`MoveFungibleTokensFlow`](https://github.com/corda/token-sdk/blob/master/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/move/MoveFungibleTokensFlow.kt)
* [`RedeemFungibleTokensFlow`](https://github.com/corda/token-sdk/blob/master/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/redeem/RedeemFungibleTokensFlow.kt)
* [`CreateEvolvableTokensFlow`](https://github.com/corda/token-sdk/blob/master/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/evolvable/CreateEvolvableTokensFlow.kt)
* [`UpdateEvolvableTokenFlow`](https://github.com/corda/token-sdk/blob/master/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/evolvable/UpdateEvolvableTokenFlow.kt)

And don't forget to dig into their inheritance and the functions they call, so that you can create your own atomic transactions.

### Utilities

It is recommended that you spend some time exploring these utility classes. They will make your life much easier, and you'll see them used very frequently in all official examples:

* [`AmountUtilities`](https://github.com/corda/token-sdk/blob/master/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/utilities/AmountUtilities.kt), to create amounts of your token type with fraction digits conversions taken care of.
* [`TokenUtilities`](https://github.com/corda/token-sdk/blob/master/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/utilities/TokenUtilities.kt)
* [`TransactionUtilities`](https://github.com/corda/token-sdk/blob/master/contracts/src/main/kotlin/com/r3/corda/lib/tokens/contracts/utilities/TransactionUtilities.kt) provides various functions to filter and aggregate your tokens.
* [`NotaryUtilities`](https://github.com/corda/token-sdk/blob/master/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/utilities/NotaryUtilities.kt), to choose a notary for your tokens.
* [`QueryUtilities`](https://github.com/corda/token-sdk/blob/master/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/utilities/QueryUtilities.kt), to create a `QueryCriteria` by `issuer` and&nbsp;/ or `holder` for your queries.
* [`FlowUtilities`](https://github.com/corda/token-sdk/blob/master/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/utilities/FlowUtilities.kt), some useful functions to get `FlowSession` and signing keys for your flows.
* [`IssueTokensUtilities`](https://github.com/corda/token-sdk/blob/master/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/issue/IssueTokensUtilities.kt), an important utility if you have a requirement to create an atomic Issue transaction manually instead of using the ready flows of the SDK.
* [`MoveTokensUtilities`](https://github.com/corda/token-sdk/blob/master/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/move/MoveTokensUtilities.kt), an important utility if you have a requirement to create an atomic Move transaction manually instead of using the ready flows of the SDK.
* [`RedeemFlowUtilities`](https://github.com/corda/token-sdk/blob/master/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/redeem/RedeemFlowUtilities.kt), an important utility if you have a requirement to create an atomic Redeem transaction manually instead of using the ready flows of the SDK.
* [`SelectionUtilities`](https://github.com/corda/token-sdk/blob/master/modules/selection/src/main/kotlin/com.r3.corda.lib.tokens.selection/SelectionUtilities.kt), gives you some `QueryCriteria` for token selectors.
* [`EvolvableTokenUtilities`](https://github.com/corda/token-sdk/blob/master/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/evolvable/EvolvableTokenUtilities.kt) is an important utility if you have a requirement to create an atomic transaction manually instead of using the ready flows of the SDK.

### Builders

If you are using a version of the Tokens SDK more recent than that used in this course, you can have access to some builders that allow a Java developer to use the same DSL syntax that a Kotlin developer has through receiver and `infix` functions (see below):

* [`FungibleTokenBuilder`](https://github.com/corda/token-sdk/blob/master/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/utilities/FungibleTokenBuilder.kt)
* [`NonFungibleTokenBuilder`](https://github.com/corda/token-sdk/blob/master/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/utilities/NonFungibleTokenBuilder.kt)

### Token Selectors

Those selectors are used by the SDK's ready flows, but you can use them as well if there is a necessity to avoid using the ready flows or the utility functions, e.g. `addMoveTokens()`:

* [`DatabaseTokenSelection`](https://github.com/corda/token-sdk/blob/master/modules/selection/src/main/kotlin/com.r3.corda.lib.tokens.selection/database/selector/DatabaseTokenSelection.kt), internally used by all of the SDK's ready flows.
* [`LocalTokenSelector`](https://github.com/corda/token-sdk/blob/master/modules/selection/src/main/kotlin/com.r3.corda.lib.tokens.selection/memory/selector/LocalTokenSelector.kt), an experimental feature that will become the default selector in SDK V2.0.

## Using Kotlin code in Java

As you know, Corda is written in Kotlin, a JVM language. More than a JVM language, it is interoperable with Java code. This means you can use the Kotlin code (classes, files, functions, etc..) inside a Java class. But Kotlin has a couple of features that Java doesn't:

1. In Kotlin, you can have a file that has a collection of functions without an encapsulating class. In order to import that file inside your Java class, you have to suffix its name with `Kt` (short for Kotlin). For instance, `AmountUtilities` is a file in the Tokens SDK that has a collection of useful functions. To use any of them inside a Java class, you must use this import statement:

    ```java
    import com.r3.corda.lib.tokens.contracts.utilities.AmountUtilitiesKt; // <-- Kt!
    ```

2. Kotlin has something called a function receiver, which lets the developer add functions to pre-existing classes without the need to create a custom class that extends the base class to add that function. Explore the below sample code from the `AmountUtilities` Kotlin file:

    ```kotlin
    /** For creating [BigDecimal] quantities of [TokenType]s. */
    infix fun BigDecimal.of(token: TokenType): Amount<TokenType> = amount(this, token)
    //        ^^^ BigDecimal is the receiver.
    // -->               ^^ "of" is the function that is "added" to the BigDecimal type.
    // -->                                                                ^^ "this" refers to the BigDecimal instance to which the .of function has been "added".
    ```
    Here, `BigDecimal` is the receiver, instructing the Kotlin compiler to _add_ as `public` the `of` function to the preexisting `BigDecimal` type. Inside the body of the function, `this` gives the `BigDecimal` instance as if `of` was truly a class method. The only restriction is that you still cannot access private and protected methods.

    Moreover, the above function declaration adds the `infix` keyword, which means that the function name can be placed between the receiver and the argument. Using it in Kotlin would look like this:

    ```kotlin
    import com.r3.corda.lib.tokens.contracts.types.TokenType
    import com.r3.corda.lib.tokens.contracts.utilities.of
    import com.r3.corda.lib.tokens.money.USD
    import java.math.BigDecimal

    fun testReceiverAndInfixFunction() {
        // Create USD token type using "money" helper file.
        val usdType: TokenType = USD

        // Create a BigDecimal amount of USD using the receiver aspect of the "of" function.
        val one: BigDecimal = BigDecimal.valueOf(1)
        val oneUsd = one.of(usdType)

        // Create a BigDecimal amount of USD using the receiver and infix aspects.
        val ten: BigDecimal = BigDecimal.valueOf(10)
        val tenUsd = ten of usdType
    }
    ```
    As you can see, the intent and readability of the code improves. Now, since Java doesn't support the receiver feature, nor `infix` functions, out of the box, Kotlin exposes the following to Java:

    ```java
    UtilityClassName/UtilityFileKt.infixFunctionName(receiverObjectInstance, functionInputParameterValue)
    ```
    So the above example would look like this in Java:

    ```java
    import com.r3.corda.lib.tokens.contracts.types.TokenType;
    import com.r3.corda.lib.tokens.contracts.utilities.AmountUtilitiesKt;
    // -->                                                            ^^ Kt
    import com.r3.corda.lib.tokens.money.FiatCurrency;
    import net.corda.core.contracts.Amount;

    import java.math.BigDecimal;

    public class TestInfixFunction {
        public void properSyntax {
            // Create USD token type using "FiatCurrency" class.
            final TokenType usdType = FiatCurrency.Companion.getInstance("USD");

            // Create a BigDecimal amount of USD using the utility function.
            final BigDecimal ten = BigDecimal.valueOf(10);
            final Amount<TokenType> tenUSD = AmountUtilitiesKt.of(ten, usdType);
            // -->                                          ^^ Kt
    }
    ```

## Conclusion

Consider this chapter a handy list that you can skim when you can't quite remember the name of the class that you know will help you out.
