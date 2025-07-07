
import { Buffer } from 'buffer';
// Polyfill Buffer for browser compatibility (for ethers.js, WalletConnect, etc)
if (!(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
