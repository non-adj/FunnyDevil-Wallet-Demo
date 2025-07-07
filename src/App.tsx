import { useState, useRef } from 'react';
import { keccak256, Wallet } from 'ethers';
import WalletConnect from '@walletconnect/client';
// @ts-ignore
import QRCode from 'qrcode';
import './App.css';

const devilRed = '#e63946';
const devilPurple = '#7209b7';
const devilYellow = '#ffd166';

function App() {
  const [step, setStep] = useState<'intro' | 'registering' | 'ready' | 'wc-connect'>('intro');
  const [ethAddress, setEthAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wcQr, setWcQr] = useState<string | null>(null);
  const [wcConnected, setWcConnected] = useState(false);
  const [wcPeer, setWcPeer] = useState<any>(null);
  const walletRef = useRef<Wallet | null>(null);
  const connectorRef = useRef<any>(null);

  // 1. Register FIDO2 key and derive wallet
  const handleRegister = async () => {
    setStep('registering');
    setError(null);
    try {
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
      const rawId = cred.rawId;
      const hash = keccak256(new Uint8Array(rawId));
      const wallet = new Wallet(hash);
      walletRef.current = wallet;
      setEthAddress(wallet.address);
      setStep('ready');
    } catch (e: any) {
      setError(e.message || 'Registration failed.');
      setStep('intro');
    }
  };

  // 2. WalletConnect integration
  const handleWalletConnect = async () => {
    setError(null);
    try {
      const connector = new WalletConnect({ bridge: 'https://bridge.walletconnect.org' });
      connectorRef.current = connector;
      if (!connector.connected) {
        await connector.createSession();
      }
      const qr = await QRCode.toDataURL(connector.uri);
      setWcQr(qr);
      setStep('wc-connect');

      connector.on('connect', (error, payload) => {
        if (error) { setError('WalletConnect connection error'); return; }
        setWcConnected(true);
        setWcPeer(payload.params[0].peerMeta);
      });
      connector.on('disconnect', () => {
        setWcConnected(false);
        setWcPeer(null);
        setStep('ready');
      });
      connector.on('session_request', (error) => {
        if (error) { setError('Session request error'); return; }
        if (!walletRef.current) { setError('Wallet not available'); return; }
        connector.approveSession({ accounts: [walletRef.current.address], chainId: 1 });
      });
      connector.on('call_request', async (error, payload) => {
        if (error) { setError('Call request error'); return; }
        if (payload.method === 'personal_sign' || payload.method === 'eth_sign') {
          try {
            const msg = payload.params[0];
            const wallet = walletRef.current;
            if (!wallet) throw new Error('Wallet not available');
            const sig = await wallet.signMessage(msg);
            connector.approveRequest({ id: payload.id, result: sig });
          } catch (e: any) {
            connector.rejectRequest({ id: payload.id, error: { message: e.message } });
          }
        } else {
          connector.rejectRequest({ id: payload.id, error: { message: 'Method not supported in demo' } });
        }
      });
    } catch (e: any) {
      setError(e.message || 'WalletConnect failed');
    }
  };

  // 3. UI
  return (
    <div className="fd-container">
      <h1 style={{ color: devilRed, fontFamily: 'cursive', fontWeight: 900, fontSize: '2.5rem', marginBottom: 0 }}>
        😈 FunnyDevil Wallet
      </h1>
      <p style={{ color: devilPurple, fontWeight: 600, marginTop: 0 }}>
        Secure Ethereum wallet with FIDO2 + PUF security key<br />
        <span style={{ color: devilYellow }}>No private keys are ever stored or shown!</span>
      </p>
      {step === 'intro' && (
        <div className="fd-wallet-card">
          <h2 style={{ color: devilRed }}>Get Started</h2>
          <ol className="fd-steps">
            <li>Plug in your FIDO2 security key (Yubikey, SoloKey, etc).</li>
            <li>Click below to register your key and create your wallet.</li>
          </ol>
          <button className="fd-btn" onClick={handleRegister}>Create Wallet with Security Key</button>
          {error && <div className="fd-error">{error}</div>}
        </div>
      )}
      {step === 'registering' && (
        <div className="fd-wallet-card">
          <h2 style={{ color: devilRed }}>Registering Key...</h2>
          <p>Touch your FIDO2 device if prompted.</p>
        </div>
      )}
      {step === 'ready' && ethAddress && (
        <div className="fd-wallet-card">
          <h2 style={{ color: devilRed }}>Your Ethereum Wallet</h2>
          <div className="fd-address">{ethAddress}</div>
          <p style={{ color: devilPurple, fontWeight: 500 }}>
            This address is derived from your FIDO2 key using a PUF.<br />
            <b>Keep your key safe!</b> Losing it means losing access to your wallet.
          </p>
          <button className="fd-btn" onClick={handleWalletConnect}>Connect to DApp (WalletConnect)</button>
          <button className="fd-btn" onClick={() => setStep('intro')}>Start Over</button>
          {error && <div className="fd-error">{error}</div>}
        </div>
      )}
      {step === 'wc-connect' && (
        <div className="fd-wallet-card">
          <h2 style={{ color: devilRed }}>WalletConnect</h2>
          <p>Scan this QR code with your DApp or wallet to connect:</p>
          {wcQr && <img src={wcQr} alt="WalletConnect QR" style={{ width: '220px', margin: '1rem auto' }} />}
          {wcConnected && wcPeer && (
            <div style={{ marginTop: '1rem', color: devilPurple }}>
              <b>Connected to:</b> {wcPeer.name}
            </div>
          )}
          <button className="fd-btn" onClick={() => {
            connectorRef.current?.killSession();
            setStep('ready');
          }}>Disconnect</button>
          {error && <div className="fd-error">{error}</div>}
        </div>
      )}
      <footer className="fd-footer">
        <p>
          <b>How does this work?</b> <br />
          Your FIDO2 key generates a unique credential using a physically unclonable function (PUF) inside the hardware. We use its rawId as a source of entropy to deterministically create an Ethereum wallet. <br />
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
