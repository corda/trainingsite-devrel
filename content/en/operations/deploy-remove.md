---
title: Deploy and remove your CorDapp
description: Make your CorDapp available on the network
slug: deploy-remove
menu:
  main:
    parent: operations
    weight: 50  
weight: 50
---

You have a running Corda server with the CorDapps that came in by default. Now you want to put yours in.

## Deploy your CorDapp

You already packaged the signed JAR and it is ready to be dropped in your node.

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
