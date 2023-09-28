---
title: Automation
description: Do things in the background
slug: automation
aliases: [
  "/corda-details/automation/"
]
menu:
  main:
    parent: corda-advanced-concepts
    weight: 90  
weight: 90
---


{{<ExpansionPanel title="Code">}}

For the exercise part, you may start by working from: https://github.com/corda/corda-training-code/tree/master/060-time-window

{{</ExpansionPanel>}}

In the previous chapters, you learned ways to improve your project. Can it still be improved? Perhaps. Let's introduce some automation. For that, let's discuss:

* Schedulable events.
* Services.

## Schedulable events

The `SalesProposal` now has an expiration date. And the seller, if they want to, can reject the offer, but only after the expiration date. What if the offer expires on Sunday at 3AM? Do you get up or do you have your node do it for you?

In Corda, achieving this schedule automation is simply a matter of a few lines of code. You already have a flow that can reject a proposal. More generally, if the flow has a handler, you need to pick an `@Initiating` one. After that, it is only a matter of making the link:

1. Have the state implement `SchedulableState`.
2. Implement the `public ScheduledActivity nextScheduledActivity` function by returning proper information to run the reject flow of your choice, at the time of your choice.
3. Annotate your chosen reject flow with `@SchedulableFlow`.

And voila. Do this micro exercise on your own before looking at a solution in the next chapter.

{{<HighlightBox type="tip">}}

If you have a hard time with the tests, have a look at [running the mock network](https://docs.corda.net/docs/corda-os/4.3/api-testing.html#running-the-network), and in particular `network.waitQuiescent()`.

{{</HighlightBox>}}

## Services

Services are single instance classes that are loaded on startup and run on the node, in the background. You already came across one, when dealing with accounts: `AccountService`, or rather [`KeyManagementBackedAccountService`](https://github.com/corda/accounts/blob/release/1.0/workflows/src/main/kotlin/com/r3/corda/lib/accounts/workflows/services/KeyManagementBackedAccountService.kt#L26-L27). Predictably, schedulable events work thanks to a [`NodeSchedulerService`](https://docs.corda.net/docs/corda-os/4.3/node-services.html#nodeschedulerservice).

Services can be used for multiple purposes, for instance:

* To start flows. You can track a certain state type (remember `trackBy`?), then initiate a flow when you get updates, like in this [automatic payment example](https://github.com/corda/samples-java/blob/master/Features/cordaservice-autopayroll/workflows/src/main/java/net/corda/samples/autopayroll/flows/AutoPaymentService.java#L30-L40). Don't forget to annotate your flow with `@StartableByService`.
* Connect to the node's database. You can use the node's JDBC connection to create custom tables and do CRUD (Create, Read, Update, and Delete) operations on those tables as in [this example](https://github.com/corda/samples-java/blob/master/Basic/flow-database-access/workflows/src/main/java/net/corda/samples/flowdb/CryptoValuesDatabaseService.java). Note its use of the widely copied [`DatabaseService`](https://github.com/corda/samples-java/blob/master/Basic/flow-database-access/workflows/src/main/java/net/corda/samples/flowdb/DatabaseService.java).


    As a side note, it's much easier to use JPA (Java Persistence API) to do CRUD operations on your custom entities instead of writing SQLs (see JPA support [here](https://docs.corda.net/docs/corda-os/4.3/api-persistence.html#jpa-support)).
* Query the vault. The service has access to `AppServiceHub`, giving you access to many operations like querying the vault.
* Implement an Oracle. More on that in the next chapter.

What do you need to declare a service? Simple. A Corda service:

1. Should have the `@CordaService` annotation. This signals to the node that it should initialize it on startup.
2. Should extend the abstract `SingletonSerializeAsToken`. Services, and large objects in general, shouldn't be serialized when a flow is check-pointed. Instead, a token that references the running service is serialized and is used to link back to the object, i.e. service, when the flow resumes. See the detailed explanation [here](https://github.com/corda/samples/blob/62722858a2f50512a9445e1f79b4619d2e8199d0/timesheet-example/workflows-java/src/main/java/com/example/service/SalaryRateOracle.java#L3-L11).
3. Should have a constructor that takes a single parameter of type `AppServiceHub`. Having this service-hub, grants the service access to privileged operations (e.g. start a flow).

Aside from those requirements, what the service does is up to you.

## Service exercise

Recall that a `SalesProposal` `Offer` transaction has 2 reference states:

* The `StateAndRef<CarTokenType>` instance.
* The `StateAndRef<NonFungibleToken>` instance.

And, both have to be unconsumed for the `Offer` transaction to be notarized successfully. Similarly, an `Accept` transaction consumes the `NonFungibleToken` but also has 1 reference state:

* The `StateAndRef<CarTokenType>` instance.

Do you see a problem here? It's a minor issue, admittedly. The seller is in control of the `NonFungibleToken`, but the `CarTokenType` is controlled by its maintainers, i.e. the DMV.

{{<HighlightBox type="warn">}}

If the DMV updates the car mileage, a new `StateAndRef<CarTokenType>` instance is created and the previous one is consumed. Therefore, the buyer can no longer notarize an `Accept` transaction.

{{</HighlightBox>}}

So, the buyer would be in breach of the terms of the offer through no fault of their own. Perhaps it is a rare issue, but not so minor after all for participants who get caught in this scenario. The first thought is to, perhaps, have the `Accept` flow ask the seller to send the latest `StateAndRef<CarTokenType>`. Surely, it will avoid a notary exception. The problem with this _solution_, given it is all automated, is that it does not give the opportunity to the seller to reconsider the offer in light of new information.

Fortunately, there are services and services can help resolve this situation.

You will remedy this situation with the help of a `ProposalService` that, in short, proactively pushes new information to the potential buyer:

* Tracks new instances of `SalesProposal`.
* Extracts the `StateAndRef<CarTokenType>` instances out of these proposals.
* In turn tracks updates on `CarTokenType`.
* When such an _offered_ `StateAndRef<CarTokenType>` has been consumed, it promptly informs the buyer of this.
* Stops tracking when proposals are consumed.

With this service, the buyer is assured of always having the latest `CarTokenType` in their vault, the latest updated facts, such that should they `Accept`, their transaction will indeed notarize. After all, when the mileage has increased, perhaps the offer is not as interesting as it was initially and possibly a `Reject` is in order.

Go!

You will find an example solution in the next chapter.

## Service Lifecycle Observer

Let's digress a bit here with a peek ahead.

Corda 4.4 introduced a new feature that allows your service to listen to node lifecycle events, such as _state machine started_ or _before node stop_, and execute an action when that event is dispatched. You can also give priorities to your lifecycle observers so certain actions execute before others.

As an example, the code below does the following:

1. Create an observer.

    ```java
    class MyServiceLifecycleObserver implements ServiceLifecycleObserver
    ```

2. Listen to the `STATE_MACHINE_STARTED` event. That is meaningful because once that event is dispatched, it means that `AppServiceHub` is available for your service to start flows and query the vault.

    ```java
    @Override
    public void onServiceLifecycleEvent(@NotNull ServiceLifecycleEvent event)
    	throws CordaServiceCriticalFailureException {

    	// This event is dispatched when the State Machine is fully started, and
    	// AppServiceHub becomes available for use.
    	if (event == ServiceLifecycleEvent.STATE_MACHINE_STARTED) {
    ```

3. Register the observer in the constructor of the service, so it starts listening to events when the service is instantiated.

    ```java
    appServiceHub.register(1000, new MyServiceLifecycleObserver());
    ```

4. Give the observer priority 1000, i.e. high. You might create another observer in this service (or another one) with a higher (e.g. 1001) or lower (e.g. 999) priority depending on which action (e.g. start a flow) should happen first. Observers with higher priority are started ahead.

    ```java
    appServiceHub.register(1000, new MyServiceLifecycleObserver());
    ```

Here's the full code:

```java
@CordaService
public class MyService extends SingletonSerializeAsToken {

	private final AppServiceHub appServiceHub;

	public MyService(AppServiceHub appServiceHub) {
		this.appServiceHub = appServiceHub;

		// Listen to node lifecycle events and execute actions.
		appServiceHub.register(1000, new MyServiceLifecycleObserver());
	}

	class MyServiceLifecycleObserver implements ServiceLifecycleObserver {

		@Override
		public void onServiceLifecycleEvent(@NotNull ServiceLifecycleEvent event)
			throws CordaServiceCriticalFailureException {

			// This event is dispatched when the State Machine is fully started, and
			// AppServiceHub becomes available for use.
			if (event == ServiceLifecycleEvent.STATE_MACHINE_STARTED) {
				// Query the vault.
				appServiceHub.getVaultService().queryBy();
				// Start a flow.
				appServiceHub.startFlow();
			}
		}
	}
}
```

## Reference Links

* [Event scheduling API](https://docs.corda.net/docs/corda-os/4.3/event-scheduling.html)
* [API: Service Classes](https://docs.corda.net/docs/corda-os/4.4/api-service-classes.html)
* [Service Lifecycle Observer](https://www.corda.net/blog/lifecycle-observer-for-cordaservice/)
* [Why use an executor](https://lankydan.dev/2018/10/05/starting-flows-with-trackby)

