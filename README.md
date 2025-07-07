# FunnyDevil Wallet Demo

A fun, educational demo web app for creating an Ethereum wallet using a FIDO2 + PUF security key (WebAuthn). Built with React + Vite + TypeScript.

## Features
- Uses WebAuthn APIs to interact with a real FIDO2 key (leveraging the PUF mechanism within the security key)
- Generates an Ethereum wallet from the FIDO2 credential using ethers.js
- Fun, simple, 'FunnyDevil' themed UI with clear steps and educational narrative
- No private keys are ever displayed or stored

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Run the app locally:**
   ```sh
   npm run dev
   ```
3. **Open your browser:**
   Visit the local URL shown in the terminal (usually http://localhost:5173)

## Requirements
- Node.js (LTS recommended)
- A browser supporting WebAuthn (Chrome, Edge, Firefox, etc.)
- A FIDO2 security key (Yubikey, SoloKey, etc.)

## How it works
1. The app guides you to register your FIDO2 key using WebAuthn.
2. If you use a PUF-based key (like the PUFido Clife Key), the private key is never stored — not even inside the device. Instead, the key is generated on-demand using PUF (Physically Unclonable Function) technology, which leverages microscopic manufacturing variations in each chip to create a unique, fingerprint-like identity that is mathematically impossible to replicate or extract.
3. The credential's public key is used to deterministically generate an Ethereum wallet (no private key is ever exposed or stored at any point). All signing operations are performed inside the security key, using the on-demand generated key.
4. You can view your Ethereum address and learn about the security model.



## What is a PUF?
A PUF (Physically Unclonable Function) is a hardware feature that uses the unique, microscopic variations in each chip to generate a secret key on-demand. No key is ever saved — not even inside the device. This makes PUF-based keys extremely secure, as there is no static secret to steal, even with physical access to the device. For more details, see the research papers referenced below.

## Security Notice
- This is a demo. Never use demo wallets for real funds.
- Losing your FIDO2/PUF key means losing access to your wallet!

---

Inspired by the FunnyDevil Wallet concept: secure, fun, and educational crypto for everyone! 😈

### References & Inspiration
- [Cryptnox Pro]: Demonstrates secure, on-demand key generation and signing using PUF-based hardware.
- PUFido Clife Key: Uses advanced PUF technology to generate a unique cryptographic key on-demand. No key is ever saved — not even inside the device. [PUFido Clife Key]
- [Research: Secure Cryptographic Key Generation Using PUFs]
- [Research: Efficient and Reliable Key Generation Using Challengeable PUFs]



#############################################Introduction and One-Shot Prompt for FunnyDevil Wallet

// This section serves as an introduction to the FunnyDevil Wallet project, outlining its purpose, design philosophy, and technical overview.


😈 FunnyDevil Wallet (FD Wallet): A Software Wallet to compliment the use of a hardware FIDO2 key with Physically Uncloneable Functionality.



Normal security keys store a static private key on-chip, but the PUFido Clife Key uses advanced PUF technology to generate a unique cryptographic key on-demand.

This means no private key is ever saved or viewable by the software, or ever generated on device. This unhackable design results from the fact no private key can be extracted.

Instead, The key is generated from the PUF hardware, which is a unique physical mechanism for cryptography within the device. 

It remains secure by performing a Cryptographic Zero-Knowledge Proof for authentication, where a private key is never stored or transmitted. 

Instead, by using a PUFido Key, a randomly generated key is used for every transaction.

Paired with FD Wallet, it will now be impossible to hack to where the funds are compromised using private key extraction, as the key is never stored in a retrievable form.

This software will be designed to be user-friendly, secure, and compatible with various cryptocurrencies and PUF keys.

FD Wallet will feature a fun 'Funny Devil' design, an easy-to-use / narrative interface, complete with simple yet strong security measures to protect users' assets.

The wallet will utilize FIDO2 + PUF keys for wallet generation, making it resistant to phishing attacks and other common threats.

The wallet will support multiple cryptocurrencies, including Bitcoin, Ethereum, and others, allowing users to manage their assets in one place. 

It will be light on features and more focused on ease of use, security, education, and design.

Most of all, it will be fun to use, while preventing the loss of funds by permanently obfuscating the private key.

Your funds = your hardware key, and your hardware key = your funds.

Don't lose your hardware key, or you lose your funds 😈



#############################################FunnyDevil Wallet Design Document

// This Section serves as a design overview for the FunnyDevil Wallet, outlining its features, security model, and user experience.




##############################################FunnyDevil Wallet Technical Overview

// This section explains how to download / localhost FunnyDevil, provides a technical overview of the FunnyDevil Wallet, including its architecture, components, and security features.




#############################################FunnyDevil Code Design, Comments, and Philosophy.

// This is a conceptual design for the FunnyDevil Wallet, enabled by vibe coding, agentic computing, and the use of PUFido keys.

The design philosophy is to create a wallet that is secure, informative, and well-designed, without ever seeing or storing the private key in a retrievable form.

FunnyDevil wallet is a concept derived from theorizing a 'Fully Deterministic' wallet that uses a PUFido key, which is a FIDO2 key with Physically Uncloneable Functionality.

The playful 'FunnyDevil' theme is intended to make the Deterministic Nature of the wallet a form of entertainment, while also providing a strong security model.