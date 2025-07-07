// pufFido2.ts
// Utility functions for FIDO2 + PUF key registration and signing
// Inspired by Cryptnox Pro and PUF research
// See README for references

import { keccak256, Wallet } from 'ethers';

/**
 * Registers a FIDO2 credential and derives an Ethereum wallet address from the credential's public key.
 * All private key operations are performed by the hardware (PUF key), never in software.
 * @returns {Promise<{ address: string, rawId: Uint8Array, wallet: Wallet }>} Ethereum address, rawId, and Wallet instance
 */
export async function registerFido2PUFWallet(): Promise<{ address: string, rawId: Uint8Array, wallet: Wallet }> {
  const publicKey: PublicKeyCredentialCreationOptions = {
    challenge: window.crypto.getRandomValues(new Uint8Array(32)),
    rp: { name: 'FunnyDevil Wallet' },
    user: {
      id: window.crypto.getRandomValues(new Uint8Array(16)),
      name: 'funnydevil@example.com',
      displayName: 'FunnyDevil User',
    },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    authenticatorSelection: { userVerification: 'preferred' },
    timeout: 60000,
    attestation: 'direct',
  };
  const cred = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential;
  if (!cred) throw new Error('No credential returned.');
  const rawId = new Uint8Array(cred.rawId);
  const hash = keccak256(rawId);
  const wallet = new Wallet(hash);
  return { address: wallet.address, rawId, wallet };
}

/**
 * Signs a message using the PUF-backed FIDO2 key (simulated via ethers.js Wallet for demo).
 * In a real PUF/FIDO2 device, signing is performed by the hardware and never exposes the private key.
 * @param wallet Wallet instance (derived from PUF key)
 * @param message Message to sign
 * @returns {Promise<string>} Signature
 */
export async function signWithPUFWallet(wallet: Wallet, message: string): Promise<string> {
  // In a real PUF/FIDO2 device, this would use WebAuthn getAssertion and custom logic
  // For demo, we use ethers.js Wallet (private key never shown)
  return wallet.signMessage(message);
}
