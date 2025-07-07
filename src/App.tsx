import { useState, useRef } from 'react';
// Simple error boundary for QR scanner step
import React from 'react';

class QRErrorBoundary extends React.Component<{ children: React.ReactNode, onError: (err: Error) => void }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
import WalletConnect from '@walletconnect/client';
// @ts-ignore
import QRCode from 'qrcode';
import { Html5QrScanner } from './Html5QrScanner';
import './App.css';
import { registerFido2PUFWallet, signWithPUFWallet } from './pufFido2';

const devilRed = '#e63946';
const devilPurple = '#7209b7';
const devilYellow = '#ffd166';

function App() {
  const [step, setStep] = useState<'intro' | 'registering' | 'ready' | 'wc-connect' | 'review' | 'scan-qr'>('intro');
  const [ethAddress, setEthAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wcQr, setWcQr] = useState<string | null>(null);
  const [wcConnected, setWcConnected] = useState(false);
  const [wcPeer, setWcPeer] = useState<any>(null);
  const [pendingTx, setPendingTx] = useState<{msg: string, id: number} | null>(null);
  const [scannedUri, setScannedUri] = useState<string | null>(null);
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

  // 2b. WalletConnect via scanned QR code or pasted URI (v1 and v2 support)
  const handleWalletConnectFromUri = async (uri: string) => {
    setError(null);
    // Detect WalletConnect v2 URI (relay-protocol param, no bridge param)
    if (/relay-protocol=/.test(uri) && !/bridge=/.test(uri)) {
      // WalletConnect v2 flow
      try {
        const { initWeb3Wallet, connectWithUriV2, listenForSessionProposals, approveSession, getWeb3Wallet } = await import('./walletconnectV2');
        // Metadata for the wallet (required by WalletConnect v2)
        const metadata = {
          name: 'FunnyDevil Wallet',
          description: 'FunnyDevil Wallet Demo (FIDO2 + PUF)',
          url: 'https://funnydevil.demo',
          icons: ['https://funnydevil.demo/icon.png'],
        };
        await initWeb3Wallet(metadata);
        await connectWithUriV2(uri);
        setStep('wc-connect');
        // Listen for session proposals
        listenForSessionProposals(async (proposal: any) => {
          // For demo, auto-approve with the registered address
          if (!walletRef.current) {
            setError('Wallet not available');
            return;
          }
          try {
            await approveSession(proposal, walletRef.current.address);
            setWcConnected(true);
            setWcPeer({ name: proposal.params.proposer.metadata.name });
          } catch (e: any) {
            setError(e.message || 'Failed to approve session');
          }
        });
        // Listen for v2 session requests (signing, etc)
        const web3wallet = getWeb3Wallet();
        if (web3wallet) {
          web3wallet.on('session_request', async (event: any) => {
            // Only handle eth_sign and personal_sign for demo
            const { request, topic } = event;
            if (request.method === 'personal_sign' || request.method === 'eth_sign') {
              setPendingTx({ msg: request.params[0], id: request.id });
              setStep('review');
              // Store topic for response
              (window as any).__fdV2Topic = topic;
            } else {
              await web3wallet.respondSessionRequest({
                topic,
                response: {
                  id: request.id,
                  jsonrpc: '2.0',
                  error: { code: 42069, message: '😈 FunnyDevil only supports eth_sign and personal_sign in this demo!' },
                },
              });
            }
          });
        }
      } catch (e: any) {
        setError(e.message || 'WalletConnect v2 failed');
      }
      return;
    }
    // WalletConnect v1 flow (default)
    try {
      const connector = new WalletConnect({ uri });
      connectorRef.current = connector;
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
    if (!pendingTx || !walletRef.current) return;
    // v2: if __fdV2Topic is set, handle v2 signing
    if ((window as any).__fdV2Topic) {
      try {
        const { getWeb3Wallet } = await import('./walletconnectV2');
        const web3wallet = getWeb3Wallet();
        if (!web3wallet) throw new Error('Web3Wallet not initialized');
        const sig = await signWithPUFWallet(walletRef.current, pendingTx.msg);
        await web3wallet.respondSessionRequest({
          topic: (window as any).__fdV2Topic,
          response: {
            id: pendingTx.id,
            jsonrpc: '2.0',
            result: sig,
          },
        });
        setPendingTx(null);
        setStep('wc-connect');
        (window as any).__fdV2Topic = undefined;
      } catch (e: any) {
        setError(e.message || 'Signing failed');
        setPendingTx(null);
        setStep('wc-connect');
        (window as any).__fdV2Topic = undefined;
      }
      return;
    }
    // v1: legacy
    if (!connectorRef.current) return;
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
  const handleRejectTx = async () => {
    if (!pendingTx) return;
    // v2: if __fdV2Topic is set, handle v2 rejection
    if ((window as any).__fdV2Topic) {
      try {
        const { getWeb3Wallet } = await import('./walletconnectV2');
        const web3wallet = getWeb3Wallet();
        if (!web3wallet) throw new Error('Web3Wallet not initialized');
        await web3wallet.respondSessionRequest({
          topic: (window as any).__fdV2Topic,
          response: {
            id: pendingTx.id,
            jsonrpc: '2.0',
            error: { code: 42070, message: '😈 FunnyDevil: User rejected the request!' },
          },
        });
        setPendingTx(null);
        setStep('wc-connect');
        (window as any).__fdV2Topic = undefined;
      } catch (e: any) {
        setError(e.message || 'Reject failed');
        setPendingTx(null);
        setStep('wc-connect');
        (window as any).__fdV2Topic = undefined;
      }
      return;
    }
    // v1: legacy
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
          <button className="fd-btn" onClick={handleWalletConnect}>Connect to DApp (Show QR)</button>
          <button className="fd-btn" onClick={() => setStep('scan-qr')}>Scan DApp QR (Mobile/Desktop)</button>
          <button className="fd-btn" onClick={() => setStep('intro')}>Start Over</button>
          {error && <div className="fd-error">{error}</div>}
        </div>
      )}

      {/* QR Code Scanner Step */}
      {step === 'scan-qr' && (
        <div className="fd-wallet-card">
          <h2 style={{ color: devilRed }}>Scan WalletConnect QR</h2>
          <p style={{ color: devilPurple }}>Point your camera at the WalletConnect QR code from the DApp you want to connect to.</p>
          <QRErrorBoundary onError={(err) => setError(err.message || 'QR scanner error') }>
            <div style={{ margin: '1rem auto', maxWidth: 320 }}>
              {/* Use a unique key to force remount on error or step change */}
              <Html5QrScanner
                key={step + (error ? '-err' : '')}
                onScan={(text) => {
                  setScannedUri(text);
                  setError(null);
                }}
                onError={(err: any) => {
                  if (err && err.name === 'NotAllowedError') {
                    setError('Camera access denied. Please allow camera permissions in your browser settings.');
                  } else if (err && err.message) {
                    setError(err.message);
                  } else {
                    setError('Camera or scanner error. Make sure your device has a camera and permissions are granted.');
                  }
                }}
                style={{ width: '100%' }}
              />
            </div>
          </QRErrorBoundary>
          <div style={{ margin: '1rem auto', maxWidth: 320, textAlign: 'center' }}>
            <input
              type="text"
              placeholder="Paste WalletConnect URI here"
              value={scannedUri || ''}
              onChange={e => setScannedUri(e.target.value)}
              style={{ width: '100%', padding: '0.5em', borderRadius: 8, border: '1px solid #ccc', marginBottom: 8 }}
            />
            <button
              className="fd-btn"
              style={{ background: devilPurple, marginTop: 4, width: '100%' }}
              disabled={!scannedUri}
              onClick={() => {
                if (scannedUri) {
                  handleWalletConnectFromUri(scannedUri);
                  setScannedUri(null);
                }
              }}
            >Connect to DApp</button>
          </div>
          <button className="fd-btn" onClick={() => { setError(null); setScannedUri(null); setStep('ready'); }}>Cancel</button>
          {/* Show scannedUri below input if present and not empty */}
          {scannedUri && (
            <div style={{ fontSize: '0.8em', color: devilPurple, marginTop: '0.5em', wordBreak: 'break-all' }}>{scannedUri}</div>
          )}
          {error && (
            <div className="fd-error">
              {error}
              {error.includes('camera') && (
                <>
                  <br />
                  <button className="fd-btn" style={{ marginTop: 8, background: devilYellow, color: '#222' }} onClick={() => setError(null)}>
                    Retry Scanner
                  </button>
                </>
              )}
            </div>
          )}
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

      {/* Transaction Review Modal (playful devil theme) */}
      {step === 'review' && pendingTx && (
        <div className="fd-wallet-card" style={{ border: `2px solid ${devilPurple}`, boxShadow: '0 0 24px #7209b799', background: '#fff6', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -32, right: 16, fontSize: '2.2em', filter: 'drop-shadow(0 2px 8px #e63946cc)' }}>😈</div>
          <h2 style={{ color: devilPurple, fontFamily: 'cursive', fontWeight: 900 }}>Devil's Signature Review</h2>
          <div style={{ background: '#ffd16633', color: devilRed, borderRadius: '1rem', padding: '1rem', margin: '1rem 0', wordBreak: 'break-all', fontWeight: 600 }}>
            <b>Message to sign:</b>
            <div style={{ fontFamily: 'Fira Mono, monospace', fontSize: '1.1em', marginTop: '0.5em', color: devilPurple }}>{pendingTx.msg}</div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="fd-btn" style={{ background: devilPurple }} onClick={handleApproveTx}>
              <span role="img" aria-label="pitchfork">🔱</span> Sign & Approve
            </button>
            <button className="fd-btn" style={{ background: devilRed }} onClick={handleRejectTx}>
              <span role="img" aria-label="no">❌</span> Reject
            </button>
          </div>
          <div style={{ marginTop: 16, color: devilRed, fontSize: '0.95em', fontWeight: 500 }}>
            <span role="img" aria-label="devil">😈</span> <b>FunnyDevil Tip:</b> Never sign anything you don't understand!<br />
            <span style={{ color: devilPurple }}>Your signature is generated by your PUF key — no private key is ever stored or shown.</span>
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
