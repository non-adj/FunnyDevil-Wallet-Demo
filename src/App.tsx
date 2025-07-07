import { useState, useRef } from 'react';
import WalletConnect from '@walletconnect/client';
// @ts-ignore
import QRCode from 'qrcode';
import './App.css';
import { registerFido2PUFWallet, signWithPUFWallet } from './pufFido2';

const devilRed = '#e63946';
const devilPurple = '#7209b7';
const devilYellow = '#ffd166';

function App() {
  const [step, setStep] = useState<'intro' | 'registering' | 'ready' | 'wc-connect' | 'review'>('intro');
  const [ethAddress, setEthAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wcQr, setWcQr] = useState<string | null>(null);
  const [wcConnected, setWcConnected] = useState(false);
  const [wcPeer, setWcPeer] = useState<any>(null);
  const [pendingTx, setPendingTx] = useState<{msg: string, id: number} | null>(null);
  const walletRef = useRef<any>(null); // Wallet type from ethers
  const connectorRef = useRef<any>(null);

  // 1. Register FIDO2 key and derive wallet (modularized)
  const handleRegister = async () => {
    setStep('registering');
    setError(null);
    try {
      const { address, wallet } = await registerFido2PUFWallet();
      walletRef.current = wallet;
      setEthAddress(address);
      setStep('ready');
    } catch (e: any) {
      setError(e.message || 'Registration failed.');
      setStep('intro');
    }
  };

  // 2. WalletConnect integration with transaction review
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
          setPendingTx({ msg: payload.params[0], id: payload.id });
          setStep('review');
        } else {
          connector.rejectRequest({ id: payload.id, error: { message: 'Method not supported in demo' } });
        }
      });
    } catch (e: any) {
      setError(e.message || 'WalletConnect failed');
    }
  };

  // 3. Handle transaction review and signing
  const handleApproveTx = async () => {
    if (!pendingTx || !walletRef.current || !connectorRef.current) return;
    try {
      const sig = await signWithPUFWallet(walletRef.current, pendingTx.msg);
      connectorRef.current.approveRequest({ id: pendingTx.id, result: sig });
      setPendingTx(null);
      setStep('wc-connect');
    } catch (e: any) {
      connectorRef.current.rejectRequest({ id: pendingTx.id, error: { message: e.message } });
      setError(e.message || 'Signing failed');
      setPendingTx(null);
      setStep('wc-connect');
    }
  };
  const handleRejectTx = () => {
    if (pendingTx && connectorRef.current) {
      connectorRef.current.rejectRequest({ id: pendingTx.id, error: { message: 'User rejected' } });
    }
    setPendingTx(null);
    setStep('wc-connect');
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

      {/* Transaction Review Modal */}
      {step === 'review' && pendingTx && (
        <div className="fd-wallet-card" style={{ border: `2px solid ${devilPurple}`, boxShadow: '0 0 24px #7209b799' }}>
          <h2 style={{ color: devilPurple }}>Review Signature Request</h2>
          <div style={{ background: '#ffd16633', color: devilRed, borderRadius: '1rem', padding: '1rem', margin: '1rem 0', wordBreak: 'break-all' }}>
            <b>Message to sign:</b>
            <div style={{ fontFamily: 'monospace', fontSize: '1em', marginTop: '0.5em' }}>{pendingTx.msg}</div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="fd-btn" style={{ background: devilPurple }} onClick={handleApproveTx}>Sign & Approve</button>
            <button className="fd-btn" style={{ background: devilRed }} onClick={handleRejectTx}>Reject</button>
          </div>
        </div>
      )}
      <footer className="fd-footer">
        <p>
          <b>How does this work?</b> <br />
          Your FIDO2 key generates a unique credential using a physically unclonable function (PUF) inside the hardware. <br />
          <b>No private key is ever stored — not even inside the device!</b> <br />
          We use the credential's public key to deterministically create your Ethereum address. All signing is performed by the hardware, never in software. <br />
          <span style={{ color: devilRed }}>This is the same security model used by Cryptnox Pro and leading PUF research.</span>
        </p>
        <p style={{ fontSize: '0.9em', color: '#888' }}>
          Inspired by the FunnyDevil Wallet concept. For demo/educational use only. 😈
        </p>
      </footer>
    </div>
  );
}

export default App;
