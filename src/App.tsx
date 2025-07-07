import { useState } from 'react';
import { keccak256, Wallet } from 'ethers';
import './App.css';

// FunnyDevil color palette
const devilRed = '#e63946';
const devilPurple = '#7209b7';
const devilYellow = '#ffd166';

function App() {
  const [step, setStep] = useState<'intro' | 'registering' | 'registered' | 'wallet'>('intro');
  const [ethAddress, setEthAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Register FIDO2 key
  async function handleRegister() {
    setStep('registering');
    setError(null);
    try {
      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: window.crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'FunnyDevil Wallet Demo' },
        user: {
          id: window.crypto.getRandomValues(new Uint8Array(16)),
          name: 'funnydevil@example.com',
          displayName: 'FunnyDevil User',
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }], // ES256
        authenticatorSelection: { userVerification: 'preferred' },
        timeout: 60000,
        attestation: 'direct',
      };
      const cred = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential;
      if (!cred) throw new Error('No credential returned.');
      // Use the credential's rawId as entropy for wallet (simulating PUF)
      const rawId = cred.rawId;
      // Derive Ethereum wallet from rawId (never display private key)
      // keccak256 expects a Uint8Array and returns a 0x-prefixed hex string
      const hash = keccak256(new Uint8Array(rawId));
      // Wallet expects a valid 32-byte private key hex string
      const wallet = new Wallet(hash);
      setEthAddress(wallet.address);
      setStep('wallet');
    } catch (e: any) {
      setError(e.message || 'Registration failed.');
      setStep('intro');
    }
  }

  return (
    <div className="fd-container">
      <h1 style={{ color: devilRed, fontFamily: 'cursive', fontWeight: 900, fontSize: '2.5rem' }}>
        😈 FunnyDevil Wallet Demo
      </h1>
      <p style={{ color: devilPurple, fontWeight: 600 }}>
        Create a secure Ethereum wallet using your FIDO2 + PUF security key.<br />
        <span style={{ color: devilYellow }}>No private keys are ever stored or shown!</span>
      </p>
      {step === 'intro' && (
        <>
          <ol className="fd-steps">
            <li>Plug in your FIDO2 security key (Yubikey, SoloKey, etc).</li>
            <li>Click the button below to register your key using WebAuthn.</li>
            <li>Watch as your Ethereum address is generated—like magic! 🔥</li>
          </ol>
          <button className="fd-btn" onClick={handleRegister}>
            Register FIDO2 Key & Create Wallet
          </button>
        </>
      )}
      {step === 'registering' && <p>Waiting for your FIDO2 key... Touch your device if prompted!</p>}
      {step === 'wallet' && ethAddress && (
        <div className="fd-wallet-card">
          <h2 style={{ color: devilRed }}>Your Ethereum Address</h2>
          <div className="fd-address">{ethAddress}</div>
          <p style={{ color: devilPurple, fontWeight: 500 }}>
            This address is derived from your FIDO2 key using PUF-like security.<br />
            <b>Keep your key safe!</b> Losing it means losing access to your wallet.
          </p>
          <button className="fd-btn" onClick={() => setStep('intro')}>Start Over</button>
        </div>
      )}
      {error && <div className="fd-error">{error}</div>}
      <footer className="fd-footer">
        <p>
          <b>How does this work?</b> <br />
          Your FIDO2 key generates a unique credential. We use its rawId as a source of entropy (simulating a PUF) to deterministically create an Ethereum wallet. <br />
          <span style={{ color: devilRed }}>No private key is ever stored, shown, or transmitted.</span>
        </p>
        <p style={{ fontSize: '0.9em', color: '#888' }}>
          Inspired by the FunnyDevil Wallet concept. For demo/educational use only. 😈
        </p>
      </footer>
    </div>
  );
}

export default App;
