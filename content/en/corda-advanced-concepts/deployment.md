---
title: Deployment
description: Or get your naked Corda up
slug: deployment
menu:
  main:
    parent: corda-advanced-concepts
    weight: 160
weight: 160
---

Now that you have the JAR, the question arises where do you deploy it. To deploy your CorDapp JAR you need to create a Corda network.You could run this locally or on the cloud.
## Setting up your Corda network locally

Depending on your preference, you could either do it manually or use Cordform or Dockerform gradle plug-ins.The [docs](https://docs.r3.com/en/platform/corda/4.8/open-source/generating-a-node.html) provide a detailed instructions for the same.

## Setting up your Corda node on the cloud

Depending on your preferred cloud provider, you can follow the steps below :

* [Azure steps](https://www.corda.net/videos/setup-corda-on-azure/)
* [AWS steps](https://www.corda.net/blog/running-corda-on-aws/)
* [GCP steps](https://www.corda.net/blog/running-corda-on-google-cloud-platform/)

## Node Explorer

With your Corda node running, how about you connect to it? The Node Explorer is a very useful tool that allows you to see all sorts of information about your node, for instance installed CorDapps and finalized transactions, and to start `@StartableByRPC` flows whose constructor parameter types are compatible. You can see a video about its capabilities [here](https://www.youtube.com/watch?v=cn2lhS8pjRs).

[Download it](https://github.com/corda/node-explorer/releases) now.

Next, find the RPC username and password in `/opt/corda/node.conf`. Then on the Node Explorer, connect with these parameters:
The rest of the GUI is self-explanatory.

## The bootstrapper

For the audacious, you may consider creating a Testnet from scratch. This is in effect what you did _in one click_ when running `deployNodes` on your local machine. Now, with the bootstrapper you can accomplish the same and then distribute the created files to separate machines, i.e. VM's.

Have a look at [the documentation](https://docs.r3.com/en/platform/corda/4.8/open-source/network-bootstrapper.html) about how to generate the required network map files.



<!--
TODO `/opt/corda/node.zip` is repeated.
TODO `deleteLockfileIfCertsExist` seems wrongly named
TODO line 156, it is already done below
TODO What: If you restart your VM you will need to restart Corda
Note that it will download your node certificate from one of Corda's server. Even though you can download it only once, and presumably the server deletes it once it has been downloaded, you should consider this certificate unsafely _disclosed_ and not use it for anything other than the Testnet
-->


## Deploy your CorDapp

You have a running Corda server with the CorDapps that came in by default. Now you want to put yours in.You already packaged the signed JAR and it is ready to be dropped in your node.

1. First, stop the Corda runtime of your node. Either:
  * With `sudo systemctl stop corda` in your VM's terminal.
  * Or kill or <kbd>CTRL-C</kbd> the `corda.jar` process.
2. Then add the new CorDapp JAR file(s) in the `cordapps` folder of your node.
3. Start the node. Either:
  * With `sudo systemctl start corda`.
  * Or `sudo /opt/corda/run-corda/sh`.
  * Or `sudo -u corda java -jar /opt/corda/corda.jar` in a screen session.

Confirm success, for instance, by listing, in the node shell, the flows available.

## Remove a CorDapp

Once you remove a _contracts_ or _flows_ CorDapp from your node, you will no longer be able to use the related states or flows. Note though, that a deleted _contracts_ CorDapp may still be present in the attachments store, and may be downloaded again from another node as part of the verification of a transaction history.

To remove a CorDapp from your node:

1. Make sure that there are no running flows that use the to-be-deleted CorDapp, by [draining](https://docs.corda.net/docs/corda-os/4.5/upgrading-cordapps.html#flow-drains) your node. If the flow on your node is a result of responding to a flow from another node, the initator flow must be killed as well. Otherwise it will be stuck waiting for your node's response.
2. Stop the Corda runtime of your node.
3. Remove the CorDapp's jar file from the `cordapps` folder.
4. Start the node.


## Docker

R3 provides an official Docker image for Corda. You can find detailed instructions about running Corda with Docker [here](https://docs.corda.net/docs/corda-os/4.4/docker-image.html).
You can also watch an [instructional video](https://www.youtube.com/watch?v=ITMOiMzkX4I).
