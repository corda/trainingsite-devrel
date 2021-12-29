---
title: Cryptography
description: Encrypt, decrypt, sign and verify
slug: cryptography
menu:
  main:
    parent: blockchain-basics
    weight: 20  
weight: 20
---

Cryptography is one of the key technologies that form the backbone for any blockchain. In this section, you will learn about some of its important concepts such as encryption, decryption, public, private keys, signing, etc.
Though many other cryptographic concepts may find applicability in the blockchain ecosystem, this section will cover the basics and the most important principles relevant to Distributed Ledger Technology.

## Cryptosystem
A cryptosystem refers to the implementation of cryptographic algorithms and its accompanying  infrastructure used to provide information security services. It is also referred to as a cipher-system.
The main idea is that the cryptosystem helps convert the plaintext to ciphertext and back, thus encoding and decoding messages securely. When two parties communicate with each other to transfer a message, referred to as plaintext, is converted into an apparently  random text, referred to as ciphertext. This process of converting plaintext to ciphertext is called Encryption. Once the ciphertext is produced, it may be transmitted over the network. Upon reception, this ciphertext is transformed back to the original plaintext using the process of Decryption.
![Cryptosystem](/blockchain-basics/Cryptosystem.png)

The main components of a cryptosystem are :
- Plaintext: the message data that is to be protected during transmission.
- Encryption Algorithm: Mathematical algorithm that converts the plaintext into the ciphertext using the Encryption key. This cryptographic algorithm takes the plaintext and Encryption key to produce the ciphertext.
- Ciphertext: This is the text produced by the Encryption algorithm from the plain text. It isn't protected and is transmitted directly on the communication channel. Any adversary having access to the communication channel can intercept this.
- Decryption Algorithm: Mathematical algorithm that recovers the plaintext from the ciphertext using the decryption key. This essentially reverses the encryption algorithm and is mathematically related to it.
- Encryption Key: This key is known to the sender, who passes it, and the plaintext as input to the Encryption algorithm in order to compute the ciphertext.
- Decryption Key: This key is known to the receiver, who passes it, and the ciphertext as input to the Decryption algorithm in order to compute the original plaintext.

There are two types of cryptosystems based on how encryption and decryption are performed:
1. Symmetric Key Encryption: Here, the same key is used for encryption as well as decryption. The popular examples are Digital Encryption Standard (DES), Triple-DES(3DES), and IDEA.
2. Asymmetric Key Encryption: Here, different keys are used for encrypting and decrypting the information. Though the keys are different, they are mathematically related. It is also known as Public-key Encryption.
   Below, we will look more into Asymmetric Key Encryption.


### Public/private key

The user generates a pair of keys that are used for encryption and decryption. These keys always come in pairs and each key offers various capabilities. Those capabilities are based on cryptographic mathematics. As their name suggests, the public key is meant to be distributed to whoever is relevant, while the private key is to be jealously guarded, akin to having your house address public, but keeping the key to your house private.
Either of these two related keys can be used for encryption, with the other one being used for decryption.
Take a look at some examples, which you may know under the names:

* RSA
* PGP, GnuPG

Example (Linux):

```
// Create SECP256K1 private key with explicit parameters for backward compatibility
$ openssl ecparam -name secp256k1 -genkey -noout -out secp256k1-key.pem -param_enc explicit
// Create public key
$ openssl ec -in secp256k1-key.pem -pubout -out secp256k1-key-pub.pem
// Show public key
$ openssl ec -in secp256k1-key-pub.pem -pubin -text -noout

// Create RSA private key
$ openssl genrsa -des3 -out rsa-key.pem 2048
Generating RSA private key, 2048 bit long modulus
.....................................................+++
...........+++
e is 65537 (0x10001)
Enter pass phrase for rsa-key.pem:
Verifying - Enter pass phrase for rsa-key.pem:
// Create public key
$ openssl rsa -in rsa-key.pem -outform PEM -pubout -out rsa-key-pub.pem
Enter pass phrase for rsa-key.pem:
writing RSA key
```

This is like a password that is used to encrypt your private key on a disk. If the private key was not encrypted, it would be at greater risk of theft. Since you are just testing here, you can put nothing or a simple word. But remember that whenever you create keys in the future, you need to protect them with a proper password.

Note that you may need OpenSSL version 1.0 or newer.

### Encrypt and decrypt

Alice wants to send a message to Bob, and for Bob's eyes only:

* Bob gives Alice his public key
* Alice uses Bob's public key to encrypt the message
* Alice sends Bob the encrypted message
* Bob decrypts the message with his private key

![Encrypt And Decrypt](/blockchain-basics/keys-001.png)

Example:

```bash
// Encrypt file
$ openssl pkeyutl -encrypt -pubin -inkey rsa-key-pub.pem -in helloworld.txt -out helloworld.enc
// Decrypt file
$ openssl pkeyutl -decrypt -inkey rsa-key.pem -in helloworld.enc -out helloworld2.txt
```

If you receive an error, try with `openssl rsautl` instead.

### Sign and verify

Alice wants to make sure that Bob's public announcement is indeed from Bob:

* Bob gives Alice his public key
* Bob signs his announcement with his private key
* Bob sends Alice his announcement and its signature
* Alice verifies the signature with Bob's public key

![Sign And Verify](/blockchain-basics/keys-002.png)

Example:

```bash
// Sign file hash
$ openssl dgst -sha256 -sign secp256k1-key.pem -out helloworld-bin.sha256 helloworld.txt
// Encode signature in Base64
$ openssl base64 -in helloworld-bin.sha256 -out helloworld.sha256

// Decode signature form Base64
$ openssl base64 -d -in helloworld.sha256 -out helloworld-bin-decoded.sha256
// Verify signature
$ openssl dgst -sha256 -verify secp256k1-key-pub.pem -signature helloworld-bin-decoded.sha256 helloworld.txt
Verified OK
```

### Mix and match

It is possible to mix both ideas, whereby Alice encrypts her message with Bob's public key, then signs the encrypt file with her private key. Upon reception, Bob verifies the signature with Alice's public key, then decrypts the file with his private key.

![Encrypt, Sign, Verify And Decrypt](/blockchain-basics/keys-003.png)


### Cryptographic hash functions

Such a hash function:

* Converts an input, a.k.a. the message, into an output, a.k.a the hash.
* Does the conversion in a reasonable amount of time.
* Is such that it is practically impossible to re-generate the message out of the hash.
* Is such that the tiniest change in the message, changes the hash beyond recognition.
* Is such that it is practically impossible to find 2 different messages with the same hash.

With such a function, you can:

* Prove that you have a message without disclosing the content of the message, for instance:
  * To prove you know your password.
  * To prove you previously wrote a message.
* Rest assured the message was not altered.
* Index your messages.

MD5 is such a function:

```bash
$ echo "The quick brown fox jumps over the lazy dog" | md5
37c4b87edffc5d198ff5a185cee7ee09
```

On Linux, it is `md5sum`. Now let's introduce a typo:

```bash
$ echo "The quick brown fox jump over the lazy dog" | md5
4ba496f4eec6ca17253cf8b7129e43be
```

Notice how the 2 hashes have nothing in common.

`MD5` is no longer considered a hard-to-crack hash function. Bitcoin uses `SHA-256`. Ethereum uses `Keccak-256`and `Keccak-512`.

It is possible to index content by its hash, in essence creating a hashtable. If you have used IPFS or BitTorrent's magnet links, among others, then you have used a hashtable.

## Digital Certificates

Digital certificates are used (among other things) to prove identity. They are given by a recognized Certification Authority(CA). A widespread procedure is the public key certificate. It proves the ownership of a public key. Below, the X.509 standard is described.

The X.509 standard is defined by the Telecommunication Standardization Sector (ITU-T) of the International Telecommunication Union (ITU).[[1]](https://en.wikipedia.org/wiki/X.509) It offers format and semantics for public key certificates. [X.509](https://www.ietf.org/rfc/rfc5280.txt) is profiled in the formal language ASN.1. Common use cases are validation of documents and securing of communication. For example, X.509 is used in TLS/SSL. Its origin is in the X.500 standard issued in 1988. Since version 3, X.509 enables flexible topologies, like bridges and meshes. Invalid certificates are listed in certificate revocation lists (CRLs). CRL is vulnerable against DoS attacks.

A X.509 certificate contains information such as version number, serial number, signature algorithm, validity period, subject name, public key algorithm, subject public key, certificate signature algorithm, certificate signature, and extensions. An extension has a type, a corresponding value, and a critical flag. Non-critical extensions are only informational.

### Signature

The concept of digital signatures is simple. If a given message is first hashed and then encrypted by a private key, one can verify the signature by decryption with the corresponding public key. You need to hash the message to avoid the creation of signatures by mixing the messages and corresponding signatures. This way, you know that the sender has the private key to the given public key. However, this is not truly an identification. Here comes the CA. The CA signs a certificate to prove the identity of the owner of a public key. The certificate includes, as described above, the subject name. This must be verified by the CA. So, the identity is given, if one can verify the CA’s signature and trust the CA.

