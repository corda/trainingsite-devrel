---
title: Libraries Introduction
description: Thou shalt not reinvent the wheel
slug: libraries-introduction
menu:
  main:
    parent: libraries
    weight: 10  
weight: 10
---

In the previous module, you created a  simple CorDapp to issue an IOU/agreement on the ledger. Congratulations! Now, alternatively, think of that agreement as an token issued on the ledger. The token was issued, transferred ownership and destroyed. Numerous other simple use-cases could be imagined using the same basic principle of token-lifecycle : issuance, transfer and destruction. Thus, the IOU/agreement used here is a non-fungible token. Similarly, fungible tokens( think of cash) could also be easily traded on Corda. Again, think of all the different use-cases that could employ a fungible token.

The concept of a token is in fact so universal that R3 decided to create an SDK that can create all sorts of tokens. You will discover it in more detail in the next chapter. On a more general level, there are many existing patterns and classes that have already been implemented. Reusing them can not only save you time, but also help you agree on a vocabulary to use when discussing or interacting with others. Here, you will discover some of these concepts, non-exhaustively. It is always good to explore the docs or the code to look for well-solved implementations that are close to what you want.

After several chapters on the Tokens SDK, in the same module, you will learn about another library, Accounts and how it could increase the accessibility and usability of your CorDapp.
