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
2. The credential's public key is used to deterministically generate an Ethereum wallet (no private key is ever exposed). The PUF mechanism in the key ensures the private key is never extractable.
3. You can view your Ethereum address and learn about the security model.

## Security Notice
- This is a demo. Never use demo wallets for real funds.
- Losing your FIDO2 key means losing access to your wallet!

---

Inspired by the FunnyDevil Wallet concept: secure, fun, and educational crypto for everyone! 😈
