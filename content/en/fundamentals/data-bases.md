---
title: Data & Databases
description: A review of databases and ledgers
slug: data-bases
menu:
  main:
    parent: fundamentals
    weight: 30
weight: 30
---


To put blockchain into context it's time to go all the way back to the advent of computing.

The aim of this is to give you a sense of how blockchain technology fits into the overall development of computing and what concepts it draws from.

This section covers a lot of historical ground, and you will be reading and absorbing content. Be ready to take notes, or skim as required for your level of knowledge.

You will refresh your knowledge and get a basic overview of:

- Key concepts and definitions in the history of databases.
- Navigational databases.
- Hierarchical database models.
- Network model.
- Differences and similarities between Networks and Hierarchical models.
- Relational databases.
- Desktop databases.
- Data transfer.
- Protocols and fault tolerance.
- Ledgers.
- Eventual consensus.

You can also find further reading at the end of this section.

## Databases - the beginning

![Database Nice Image](/fundamentals/database.png)

Of course, it's likely that all of this is known to you, but it may help to start by taking a look at data and databases, the developmental steps and concepts involved.

First, a few definitions:

* Data is a series of one or more symbols given meaning by acts of interpretation.
* A database is an organized collection of data.
* A database management system (DBMS) is a program (or system), used to manage and interact with a database.

The history of databases is often categorized into 3 different eras: navigational, relational and post-relational databases.

Let us have a closer look at the different types of databases and their evolution in time.

<!-- TODO Data and Databases https://www.youtube.com/watch?v=8BhzjcF79B8 -->

## Navigational Databases

One of the early storage medium used in database technology was magnetic tape, which replaced punch cards and paper tape.
The earliest implementations of database management systems would iterate through the whole tape and check whether the unit of data at hand fit a given set of criteria.
Therefore, magnetic tape was introduced as a possibility to allow for searching.
The first major innovation in database structure was the development of navigational databases, in which a record includes a location reference to another linked piece of data.
This way, data was retrieved from tape machines, and later hard disks, by following the location pointer, rather than having to iterate through all the data.

![navigational database](/fundamentals/anavigationaldatabase.png)

One of the first data management systems (databases) were the Integrated Data Store (IDS), designed by Charles W. Bachman, as well as the Information Management System (IMS) by IBM. Both were precursors for navigational databases.

In the mid-1960s the commercial use of database systems became more common and with it the need for standardisation.
Charles W. Bachman founded the Database Task Group as part of the Conference on Data Systems Languages (CODASYL) and working closely with the CODASYL subgroup the Data Description Language Committee (DDLC).
In 1971 the so-called CODASYL approach was presented.
In it linked data sets were formed into a network, in which one could find records by using a primary key, the CALC key, navigating the single sets, or scanning the records sequentially.

The most popular data models were CODASYL, a network model, and IMS, a hierarchical model.

## Hierarchical Database Model

In the 1960s, IBM created the first hierarchical database, IMS. They were mainly used in beginning mainframe DBMS.

Hierarchical data base models have a tree-like structure. Data is stored as a record, which again is connected to other records by links.
The tree-like structure is a result of record relationships.

Whereby a record is a compilation of fields containing exactly **one** value and its entity type defines the field the record comprizes.
A record is comparable to a row/tuple in relational databases and an entity type to a table/relation.
Each record in a hierarchical database has **one** parent record and can have **one or more** children records.

![hierarchical database](/fundamentals/hierarchicaldatabasemodel.png)

The structure is quite simple, but at the same time confined to a one-to-many relationship and therefore inflexible.
To retrieve data, one has to run through the whole "tree" starting at the root node and continuing throughout the tree-like structure.

Hierarchical models lost ground after Codd's relational model was introduced.
With the Extensible Markup Language (XML) coming up in the late 1990s, hierarchical database models re-emerged.
Nowadays, they are mostly utilized for applications needing high performance and data availability.
Application areas are geographic information data storing, as well as file systems and databases in banking and telecommunications.

Examples of hierarchical models include the IBM Information Management System (IMS), RDM Mobile and the Windows Registry in Microsoft Windows.

## Network Model

Network models were introduced by Charles Bachman.
They follow a schema, in which object types are the nodes of a graph and relationship types the arcs.
Thus, hierarchical structure or lattice, where graphs illustrations would follow a regular tiling, is not a characteristic of this model.
In addition, network models have a generalized graph schema, in which record types are connected by relationship types, while at the same time, the database is a generalized graph of recorded events connected through their relationships.

![network model database](/fundamentals/networkmodel.png)

Therefore, network database models are flexible and seem more natural in regard to the modelling of relationships between entities/objects.

Even though network models have several benefits, other models were more dominant due to several reasons.
Among them, this type of model did not become dominant because of IBM’s preference for hierarchical models, as well as the emergence of relational models with a higher level and more descriptive interface.

Examples of a network model are the Integrated Data Store (IDS), Integrated Database Management System (IDMS) and Raima Database Manager.

## Comparing Hierarchical Databases and Network Models

Hierarchical models follow a simple structure, but this also makes them inflexible.
They are not suited for large amounts of relationships because of the navigational constraints and tree-like schema.
In addition, the implementation is quite complex and they are difficult to manage. A lack of structural independence and standards can be observed.

Network models have a more natural manner of modelling relations between entities and are thus more flexible, but they create complex systems which are difficult to design and to maintain.
As hierarchical models, they lack structural independence.

![Model Comparison](/fundamentals/datatable.png)

In the early 1980s, low-level navigational interfaces based on hierarchical and network models were used for large-scale applications for performance reasons.
With improved hardware performance, relational models provided more productivity and flexibility.
In the end, relational models made them more and more obsolete, especially in the context of networks for corporate enterprises.

## Relational Databases

In 1970 Edgar F. Codd published his influential paper [_A Relational Model of Data for Large Shared Data Banks_](https://github.com/dmvaldman/library/blob/master/computer%20science/Codd%20-%20A%20Relational%20Model%20of%20Data%20for%20Large%20Shared%20Data%20Banks.pdf).
It proposed a new model for databases that relied on fixed-size tables sharing identifiers across tables to tie content together.
Rather than searching by following links, Codd suggested a search for data by content.

Not only was this an important technological development, but it also created a new, abstracted space in which data was conceptually unbound by data banks by virtually merging them together and therefore disconnecting them from physical data storage.
SEQUEL or SQL, initially developed to manage data in relational databases by IBM to utilize the model code proposed in the 1970s, enabled new kinds of applications by making it possible to effectively search databases and create large inter-relational data sets that did not rely on a linked-list approach.

{{<HighlightBox type="info">}}

The Structured English Query Language (SEQUEL) was initially developed by IBM in the early 1970s, specifically by Donald D. Chamberlin and Raymond F. Boyce. The acronym SEQUEL was later changed to SQL due to legal reasons; the original acronym was trademarked by Hawker Siddeley, an aircraft company based in the UK.

{{</HighlightBox>}}

The most commonly used relational database (management) systems today all use a very similar (but not identical) SQL version (eg. PostgreSQL, MySQL, DB2, Microsoft SQL Server).

## Desktop Databases

Increased computer sales led to relational databases becoming a commercial success.
While network and hierarchical database models became more and more unpopular, computing hardware became more powerful.
Thus, the 1980s brought desktop computers and the possibility to store data, as well as run database software on desktop hardware. Originally data was kept in silos and SQL brought them together into one virtual space.
With the advent of desktop computing data was now siloed in desktop computers.

In the 1990s, object-oriented programming, in which data is conceptualized as objects, allowed solving the problem of having to translate between database tables and programmed objects and led to object and object-relational databases (ORD) and the use of object-relational mappings.

New post-relational databases as a response to the Internet and need for fast processing of unstructured data appeared in the 2000s.
NoSQL databases, which are non-relational, introduced key-value stores and document-orientation.
These new type of databases are resource intensive and confront database admins (DBA) and maintainers with new issues, unknown in the context of relational databases.
NoSQL databases are often differentiated as:

* Document-oriented databases with strong query engines and index controls, such as MongoDB, Amazon Dynamo DB.
* Column stores that store data as portions of columns and not rows, for example Cassandra or Cloudera.
* Key-value stores, like Redis, Berkeley DB or Aerospike.
* Graph data stores based on graph theory, e.g. Neo4j, GraphBase, Titan.

While all of this development was taking place, networking between computers was developed and improved. More on this in the next section.

## Data Transfer

The most basic attribute of networks is the ability to transfer data between computers.
Let us briefly recall how that process works in the context of databases.

Imagine two machines that are connected to each other and have access to two different databases.

1. Computer A sends a discrete request for a set of information that is located on another machine, Computer B.
2. Computer B accesses its database, querying for the data Computer A asked for.
3. Computer B retrieves the data and compiles a *document*, a set of structured data that has a beginning and an end.
4. Computer B sends the document to Computer A.
5. Computer A receives the document and interprets the data, perhaps storing it in its own database or executing a series of actions.

The role of the document is important to highlight here.
To synchronize data between machines, an encode-decode sequence happens on the two computers involved by first including a sequence of characters in a specialized format and afterwards reversing the process.
Common codes include the American Standard Code for Information (ASCII) for text files, Unicode, MIME, BinHex and Uuencode, and in the context of data communications among others Manchester encoding.

A good example for a document transfer is an API request.

1. A client sends a request to an API endpoint, along with attributes for the data requested, e.g. `GET https://example.com/inventory?id=2311`.
2. The server receives the request and queries its inventory database for the data requested, e.g. `SELECT * FROM inventory.products WHERE id=2311;`.
3. Server forms a JSON response, the *document*, from the data, e.g. `{"products": [{"id": "2311", "name": "Raw Linseed Oil"}]}`.
4. Server sends the document to the client, which is waiting for the response.
5. Client reads the document, attempts to parse it as JSON, and stores the product information in a local SQLite database, e.g. `INSERT INTO favourites (ext_id, name)
VALUES (2311, "Raw Linseed Oil");`.

What are some potential failures?

* The client could send a request that the server does not understand, or send a malformed request.
* The server could create a document that the client does not understand, e.g. the server sends XML when the client expects JSON.
* The server could send a malformed document.
* Either party could send a malicious request, e.g. SQL injection `GET https://example.com/inventory?id=2311%3BDROP%20TABLE%3B`.

A lot of effort in modern network systems, and in fact the web itself, goes into mitigating these translation and synchronisation issues.
Traditionally, synchronisation issues were often mitigated by implementing hierarchy.
Blockchain is effectively a non-hierarchical approach to mitigate these issues by making sure that every participant always has access to enough data to verify the integrity of ALL the data in the network.

## Protocols & Fault Tolerance

Before diving into how these issues are approached with blockchain technology, reconsider how protocols in networking solve problems inherent to a hierarchy-free, fault-prone environment.

The term computer networking covers both the hardware side, as well as the software protocols used to transmit data and let computers communicate with one another. Because networks have a physical aspect, the interaction between software and hardware is especially interesting in a blockchain context.

Imagine a cable connection between two computers. Traditionally a coaxial cable would have been used to carry a signal.
Cables can be subject to interference from a broad range of things, so there is no guarantee that the signal originating at point A will be received by point B.
To mitigate this problem and ensure communication a whole stack of protocols on the hardware and software level has been developed, with many foundations laid in the famous Xerox PARC.

Protocols are behavior guidelines for machines, so that they can cooperate and understand each other, as well as mitigate translation and synchronisation issues.

Whereas the capability of a computer or electronic system, or a network to keep operating while components fail is subsumed under the term fault tolerance.
In case of a failure, it requires a system to continue operation without interruption while it is repaired (no single point of failure).
In addition, failures shall not affect the entire system by being isolated (fault isolation) and contained (fault containment).
The availability of reversion modes is also of importance.

In order to facilitate the transfer of data, protocols like TCP split data into small packets and transmit each one of them individually.
On the hardware level these bits of digital data are converted into an analogue signal.
On the receiving end the signals are reconstructed and the other end of the software protocol re-assembles the original piece of data.
If a packet is missing, the receiving computer can ask for the re-transmission of the missing bundle of data.

![Document Request](/fundamentals/document.png)

When approaching blockchain technology it is worth recalling these basics of computing because the technology operates in a similarly uncertain environment and is designed to minimize the potential for disruption and damage in adverse conditions.

## Ledgers

A ledger is a book or file recording and totalling economic transactions. Importantly, transactions are recorded in chronological order as they are executed. The order of transactions is extremely relevant and is one of the reasons why Blockchain protocols are designed the way they are.

In order to get a picture of the state of accounts at any point, one must tally all transactions up to that point. One by one, every transaction record alters the state.

Every transaction in a ledger contains an arbitrary set of data, depending on their purpose. In ledgers that record monetary transactions the ledger might contain the following data:

- Sender
- Recipient
- Amount
- Credit/Debit
- Reference

Ultimately the data recorded depends on the structure and purpose of the ledger. This will be important later, so remember that transactions are ultimately chronologically ordered chunks of data.

Going through and processing each transaction in the ledger enables us to derive all kinds of meta information. This can include number of transactions, activity per account and of course, individual account balances. An account balance, like the balance of your bank account, is an abstract representation and summary of a list of transactions.

![Trusted Authority controls entry to the ledger](/fundamentals/ledger-entry-validation.png)

Traditionally ledgers are maintained by a trusted authority, a ledger keeper. These days ledger keepers include insurance companies, banks, tax collectors and many others. In order to make a transaction you will go through the following steps:

1. Identify yourself to the ledger keeper
2. Request data from the ledger keeper, eg. about your account balance
3. Request the recording of a new transaction
4. Ledger keeper will check the validity of the transaction (is your balance sufficient, is your account frozen etc.)
5. Ledger keeper enters the transaction into the ledger and informs other ledger keepers of the transaction if necessary. For example, another bank if your transaction involves sending money elsewhere.
6. Recipients can now identify themselves with their ledger keeper and ascertain their updated balance

This system works well as long as ledger keepers can be trusted. There is reason to believe that the development of the Bitcoin protocol, the first successful implementation of Blockchain technology, was in part motivated by the financial crisis in 2008.

### Forking

Forking in software engineering describes a process, in which a developer works on a copy of a source code to create a new, independent piece of software.
In the blockchain context, the term forking includes an analogous mechanism, but is applied and intended for different purposes.
Forks describe cases when a blockchain could continue on two different transaction history paths or according to two different regulation validation regimes.

A more recent block points to the block that came right before itself.
It does so by storing the hash of its immediately preceding block.
Thus, it is possible for 2 different blocks to claim to be the successor of a given block.
In this case, there is a fork. The protocol provides a mechanism to eventually focus on a single branch of the fork automatically, if the user does not explicitly instruct its client to follow a specific fork.

![Fork Example](/fundamentals/blockchain_forking.png)

### Eventual consensus

The CAP theorem states that in a distributed system, you can, at most, pick 2 out of these 3 properties:

- Consistency
- Availability
- Partition tolerance

Blockchain aims for perfect availability and reaches eventual consistency by making partitions economically uninteresting.
The consensus is eventual. Indeed, two, or more, nodes may win the mining puzzle at the same time. Other nodes then receive competing claims. However individual nodes are unlikely to receive both claims simultaneously. The protocol provides for that. The block with the most transactions or with the most complex puzzle solved is selected.
If undecided, then it is a fork, i.e. two competing truths. As further blocks are added to each side of the fork, nodes will reevaluate for length and complexity and eventually decide which side of the fork to keep working with. As time moves on, it becomes less and less likely that both sides of the fork will have identical lengths and complexities.
The probable preference of other nodes becomes increasingly clear to all nodes. The nodes adjust their own preference accordingly.
Hence, the eventual consensus.

## Learn more

- [A History of Databases] (http://www.springer.com/cda/content/document/cda_downloaddocument/9781447156000-c2.pdf?SGWID=0-0-45-1430025-p175494435)
- [Achievements of Edgar F. Codd] (http://www-03.ibm.com/ibm/history/exhibits/builders/builders_codd.html)
- [Evolution of Database Models] (https://www.fing.edu.uy/inco/grupos/csi/esp/Cursos/cursos_act/2000/DAP_DisAvDB/documentacion/OO/Evol_DataModels.html)
- [CAP "theorem"](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed)
