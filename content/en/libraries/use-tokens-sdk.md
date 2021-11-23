---
title: You use the Tokens SDK
description: Improve your project with the Tokens SDK
slug: use-tokens-sdk
menu:
  main:
    parent: libraries
    weight: 40  
weight: 40
---


{{<ExpansionPanel title="Code">}}

You may start this exercise by working from: https://github.com/corda/corda-training-code/tree/master/020-first-token

{{</ExpansionPanel>}}

## Exercise summary

In your project, from the previous module, you created a fungible token, ostensibly to be used as an air-mile by the world's airlines. Now, oops, you are going to make use of the Tokens SDK and focus your efforts only on what you have to do on our own. So go ahead and do the following:

1. Find the proper way to express your air-mile token type.
2. Get rid of your `TokenState` and use `FungibleToken` instead.
3. Get rid of your `TokenContract` and use the available contract instead.
4. Update your contract unit tests so that they become _learning_ tests about the token contract.
5. Modify your `IssueFlow` to use one of the Tokens SDK issue flows.
6. Modify your `MoveFlow` to use one of the Tokens SDK move flows.
7. Modify your `RedeemFlow` to use one of the Tokens SDK redeem flows.
8. Adjust your flow tests to confirm your flows work.

## Additional help

Achieving these modest aims might not be as easy as the list above suggests. Moreover, if you want your flows to still take the same input types like `List<StateAndRef<TokenState>>` (you should), or whichever is applicable in the new stage, then you need to dig a bit. For example, it will be beneficial to clone the [Tokens SDK repo](https://github.com/corda/token-sdk) and load it as a project into a separate IntelliJ window. Here is what we mean by digging a bit.

1. [`IssueTokens`](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/rpc/IssueTokens.kt):

    * is a high-level `@InitiatingFlow` that [sub-flows](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/rpc/IssueTokens.kt#L37) the inlined, non-initiating, [`IssueTokensFlow`](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/issue/IssueTokensFlow.kt).
    * has the automatic responder [`IssueTokensHandler`](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/rpc/IssueTokens.kt#L45), which itself sub-flows [`IssueTokensFlowHandler`](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/issue/IssueTokensFlowHandler.kt).
2. [`MoveFungibleTokens`](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/rpc/MoveTokens.kt#L33):

    * is a high-level `@InitiatingFlow` that sub-flows the inlined [`MoveFungibleTokensFlow`](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/move/MoveFungibleTokensFlow.kt#L25-L33), which itself extends [`AbstractMoveTokensFlow`](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/move/AbstractMoveTokensFlow.kt).
    * has the automatic responder [`MoveFungibleTokensHandler`](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/rpc/MoveTokens.kt#L70-L73), which itself sub-flows [`MoveTokensFlowHandler`](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/move/MoveTokensFlowHandler.kt).
3. Interestingly [`MoveTokensFlow`](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/move/MoveTokensFlow.kt#L22-L29):

    * also inherits from `AbstractMoveTokensFlow`
    * and takes inputs as `List<StateAndRef<AbstractToken>>`. Yeah!
4. [`RedeemFungibleTokens`](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/rpc/RedeemTokens.kt#L17):

    * is a high-level `@InitiatingFlow` that sub-flows the inlined [`RedeemFungibleTokensFlow `](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/redeem/RedeemFungibleTokensFlow.kt), which itself extends [`AbstractRedeemTokensFlow `](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/redeem/AbstractRedeemTokensFlow.kt).
    * has the automatic responder [`RedeemFungibleTokensHandler `](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/rpc/RedeemTokens.kt#L35-L38), which itself sub-flows [`RedeemTokensFlowHandler `](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/redeem/RedeemTokensFlowHandler.kt).
5. Interestingly [`RedeemTokensFlow`](https://github.com/corda/token-sdk/blob/5f189fbf54c400343729155a856b99ed91d40da8/workflows/src/main/kotlin/com/r3/corda/lib/tokens/workflows/flows/redeem/RedeemTokensFlow.kt#L23-L30):

    * also inherits from `AbstractRedeemTokensFlow`
    * and takes inputs as `List<StateAndRef<AbstractToken>>`. Boom.

## Conclusion

Use those to review your higher-level flows. See if you can adapt them and their tests to use the SDK.

In the next chapter, we will disclose a modified example project using the SDK. No peeking.

{{<HighlightBox type="support">}}

Get 3 months access to the authors and experts who created this training.

* Expert instructors will review your code and help you to refine it.
* One-on-one support and mentoring from expert instructors.
* Collaboration with fellow students in a dedicated Training Slack channel.

<div class="cta-wrapper">
<a href="/in-closing/get-paid-support/" class="cta-button">Learn More</a>
</div>

{{</HighlightBox>}}
