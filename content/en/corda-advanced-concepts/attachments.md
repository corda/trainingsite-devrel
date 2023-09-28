---
title: Attachments
description: Attaching files to transactions
slug: attachments
aliases: [
  "/corda-details/",
  "/corda-details/attachments/",
  "/corda-details/introduction/"
]
menu:
  main:
    parent: corda-advanced-concepts
    weight: 10
weight: 10
---

There are cases where network participants need to reuse a certain piece of data. Corda facilitates that task by allowing to add that piece of data as an attachment to the transaction. When a party receives that transaction, they can then request the attachment file from the sender.

Attachments are limited to `zip` and `jar` files for the following reasons:

1. To avoid transferring large files over the wire.
2. To allow the execution of some of those attachments, in the case of `jar` files.
3. `jar` files can be signed with the `jarsigner` tool, making it possible to restrict acceptable attachments to a certain list of signing keys.

Obviously, you can attach any file type as long as you place it inside a `zip` or a `jar` file. Of note is that `jar` files are essentially [fancy `zip`](https://docs.oracle.com/javase/8/docs/technotes/guides/jar/jar.html#Intro) files themselves.

Among its many moving pieces, a Corda node also has an attachment store where it keeps such things. Those attachments are not referenced by a file name or other external id. Instead they are referenced by their SHA256 content **hash**. This is another example of a content-addressable store. As with so many other aspects of DLT, it prevents tampering.

So yes, _attaching a file_ to a transaction is no different than [adding its hash](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/transactions/TransactionBuilder.kt#L732).

Aside from the type of file attached, attachments can be grouped into 2 major logical groups, **contract** `jar` files and general files.

### Contracts `jar` files

As you know, when a transaction is created, a contract must be specified for each state type that is part of said transaction.

* The contracts' role is to validate the state transitions that the transaction represents.
* This validation needs to be deterministically reproducible, now and in the future, which requires the exact contracts that were used during the initial finalisation.

It is, therefore, to facilitate reproducibility that contract jars are attached to transactions. So when a responding node calls `ReceiveFinalityFlow` to finalize the received transaction, it in turn executes the **pre-uploaded** contracts found in the relevant jar files.

Indeed, given the risk of mischief, contracts are _pre-uploaded_ and not downloaded automatically to the node. You got a taste of that when you removed a jar file from one of the nodes and then ran the IOU CorDapp.

It's worth mentioning that not any uploaded `jar` file will be accepted as a valid contract container either. There are various [contract constraints](https://docs.corda.net/docs/corda-os/4.3/api-contract-constraints.html) that control what gets accepted.

### General files

General files can be any piece of data that's being shared and reused by the network participants. For instance, the kotlin-samples repository has an [example](https://github.com/corda/samples-kotlin/tree/master/Features/attachment-blacklist) where an attachment file contains the names of blacklisted parties. So those parties cannot participate in an agreement.

* The file [is defined here](https://github.com/corda/samples-kotlin/blob/master/Features/attachment-blacklist/contracts/src/main/resources/blacklist.jar).
* If you `unzip blacklist.jar`, you get:

    ```shell
    $ unzip blacklist.jar
    Archive: blacklist.jar
     extracting: anotherfile.txt
      inflating: blacklist.txt
    ```
* Also calculate its SHA256 hash:

    ```shell
    $ shasum -a 256 blacklist.jar
    4cec607599723d7e0393eb5f05f24562732cd1b217deaedeabd4c25afe5b333a  blacklist.jar
    ```
  Which, thankfully, matches the [value hard-coded](https://github.com/corda/samples-kotlin/blob/fdbc2cb2b897406f890e36c8afd64ed0f1d52391/Features/attachment-blacklist/contracts/src/main/kotlin/net/corda/samples/blacklist/contracts/AgreementContract.kt#L14) in the contract.
* On the contract, see that it expects a [single extra attachment](https://github.com/corda/samples-kotlin/blob/fdbc2cb2b897406f890e36c8afd64ed0f1d52391/Features/attachment-blacklist/contracts/src/main/kotlin/net/corda/samples/blacklist/contracts/AgreementContract.kt#L26).
* That should also be of the [expected hash](https://github.com/corda/samples-kotlin/blob/fdbc2cb2b897406f890e36c8afd64ed0f1d52391/Features/attachment-blacklist/contracts/src/main/kotlin/net/corda/samples/blacklist/contracts/AgreementContract.kt#L33).
* That uses some [facility given by Corda](https://github.com/corda/samples-kotlin/blob/fdbc2cb2b897406f890e36c8afd64ed0f1d52391/Features/attachment-blacklist/contracts/src/main/kotlin/net/corda/samples/blacklist/contracts/AgreementContract.kt#L36) to [extract the desired file](https://github.com/corda/samples/blob/b97280b2252b5bfcf118eacac6b3b80ef84c5356/blacklist/src/main/kotlin/net/corda/examples/attachments/contract/AgreementContract.kt#L37), then [builds the list](https://github.com/corda/samples/blob/b97280b2252b5bfcf118eacac6b3b80ef84c5356/blacklist/src/main/kotlin/net/corda/examples/attachments/contract/AgreementContract.kt#L40) of blacklisted companies.
* With that, it makes sure that there is no overlap with the transaction participants.

In this example, the attachment's content is used in the code. Of course using the content of a file in your contract code is not a necessity. You are free to add an attachment for serious purposes such as the contract legal prose, or for frivolous reasons.

## Manipulating Attachments

We have seen that attachments are added _by hash_. And the nodes have a hash-indexed attachment store. This store can receive new attachments, either when instructed by the administrator, or when a new transaction mentions an unknown hash. The latter [triggers a download request](https://github.com/corda/corda/blob/68bb7a0e7bb900117c2ed0d9174fea36d3d4aedc/core/src/main/kotlin/net/corda/core/internal/ResolveTransactionsFlow.kt#L84-L88) to the node that submitted the transaction.

Here is a list of the most common attachment tasks.

### Direct upload

You can upload an attachment manually or programmatically.

* To do it manually, simply run one of the following commands from within your node's shell.

    ```yaml
    >>> run uploadAttachment jar: path/to/the/file.jar
    ```
    Or, the variation that allows you to specify the `uploader` and `filename` metadata,
    which you can later use to search for this attachment.

    ```yaml
    >>> run uploadAttachmentWithMetadata jar: path/to/the/file.jar, uploader: myself, filename: original_name.jar
    ```
    Either operation will return you the hash string that you can use at a later stage.

* To do it programmatically, use the `ServiceHub` attachments functionality, typically, within a flow.

    ```java
    final SecureHash attachmentHash = getServiceHub().getAttachments().importAttachment(
            new FileInputStream(new File("path/to/file")), "uploader_name", "filename");
    ```

### Addition to a transaction

This is really simple when you have the `attachmentHash`. If you only have the string of the hash, use:

```java
final Party notary = getServiceHub().getNetworkMapCache().getNotaryIdentities().get(0);
final TransactionBuilder transactionBuilder = new TransactionBuilder(notary);

// Add attachment to transaction.
final SecureHash attachmentHash = SecureHash.parse(hashString);
transactionBuilder.addAttachment(attachmentHash);
```

### What's in my attachment store?

When searching for an attachment, you can do it either by its **hash** or by its **metadata**, and you can do either in your node's shell or from within a flow:

* To search by id:

    ```yaml
    // From inside of a node's shell.
    >>> run openAttachment id: AB7FED7663A3F195A59A0F01091932B15C22405CB727A1518418BF53C6E6663A
    ```

    ```java
    // From inside of a flow.
    final Attachment attachment = getServiceHub().getAttachments().openAttachment(SecureHash.parse("Id"));

    // You can also use "openAsJar()" if it's a jar file.
    final InputStream content = attachment.open();
    ```

* To search by metadata, `AttachmentQueryCriteria` comes into play. You need to add a new dependency, and then you can have multiple criterias and combine them with `.and`, `.or`, `.like`, etc... The dependency is:

    ```groovy
    dependencies {
        cordaCompile "$corda_release_group:corda-node:$corda_release_version"
    ```
    Then within a flow:

    ```java
    final FieldInfo attributeUploader = QueryCriteriaUtils.getField(
            "uploader", NodeAttachmentService.DBAttachment.class);
    final FieldInfo attributeFilename = QueryCriteriaUtils.getField(
            "filename", NodeAttachmentService.DBAttachment.class);

    final ColumnPredicate<String> uploaderPredicate = Builder.equal(attributeUploader, "me").component2();
    final ColumnPredicate<String> filenamePredicate = Builder.equal(attributeFilename, "my-file.zip").component2();

    final AttachmentsQueryCriteria attachmentsCriteria = new AttachmentsQueryCriteria()
            .withUploader(uploaderPredicate)
            .withFilename(filenamePredicate);
            /*
             You can also query by:
                .withContractClassNames()
                .withSigners()
                .withUploadDate()
                .withVersion()
            */

    final List<SecureHash> results = getServiceHub().getAttachments().queryAttachments(attachmentsCriteria);
    ```

### In a contract

Within the contract you could do the following:

```java
final Attachment attachment = tx.getAttachment(SecureHash.parse("id"));
// You can also use "openAsJar()" if it's a jar file.
final InputStream content = attachment.open();
```

## Conclusion

You have seen that transactions have attachments, and that nodes store and exchange them on the side. There is no guided exercise.

## Useful Links

- [Using Attachments](https://docs.corda.net/docs/corda-os/4.3/tutorial-attachments.html)
- Blacklist [Example](https://github.com/corda/samples/tree/release-V4/blacklist)
- Send&nbsp;/ Receive&nbsp;/ Download Attachments [Example](https://github.com/corda/samples/tree/release-V4/sendfile-Attachments)
- Attachments Key Concepts [Video](https://vimeo.com/channels/1427919/213879328)
- `Attachment` [Interface](https://api.corda.net/api/corda-os/4.3/html/api/kotlin/corda/net.corda.core.contracts/-attachment/index.html)
