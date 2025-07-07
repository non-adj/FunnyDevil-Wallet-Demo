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