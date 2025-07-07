// Pair with a WalletConnect v2 URI (call this when user pastes a v2 URI)
export async function connectWithUriV2(uri: string): Promise<void> {
  if (!web3wallet) throw new Error('Web3Wallet not initialized');
  try {
    await web3wallet.core.pairing.pair({ uri });
  } catch (err) {
    throw new Error('Failed to pair with WalletConnect v2 URI: ' + (err instanceof Error ? err.message : String(err)));
  }
}
// Minimal WalletConnect v2 (Web3Wallet) setup for FunnyDevil Wallet Demo
// This is a starting point for v2 support. You must add your projectId from WalletConnect Cloud.

import { Web3Wallet } from '@walletconnect/web3wallet';
import type { Web3WalletTypes } from '@walletconnect/web3wallet';

// TODO: Replace with your WalletConnect Cloud projectId
const WALLETCONNECT_PROJECT_ID = '6f88fc8b1cbf3d669bf64e3ce42502dc';

import type { IWeb3Wallet } from '@walletconnect/web3wallet';
let web3wallet: IWeb3Wallet | null = null;

import SignClient from '@walletconnect/sign-client';

export async function initWeb3Wallet(metadata: Web3WalletTypes.Metadata) {
  if (web3wallet) return web3wallet;
  // Create a SignClient instance with projectId
  const signClient = await SignClient.init({
    projectId: WALLETCONNECT_PROJECT_ID,
    metadata,
  });
  web3wallet = await Web3Wallet.init({
    core: signClient.core,
    metadata,
  });
  return web3wallet;
}

export function getWeb3Wallet() {
  return web3wallet;
}

// Example: Listen for session proposals
export function listenForSessionProposals(onProposal: (proposal: Web3WalletTypes.SessionProposal) => void) {
  if (!web3wallet) throw new Error('Web3Wallet not initialized');
  web3wallet.on('session_proposal', onProposal);
}

// Example: Approve a session
export async function approveSession(proposal: Web3WalletTypes.SessionProposal, address: string) {
  if (!web3wallet) throw new Error('Web3Wallet not initialized');
  const requiredNamespaces = proposal.params.requiredNamespaces;
  // Try to find eip155 or fallback to first available namespace
  let nsKey = 'eip155';
  if (!requiredNamespaces.eip155) {
    const keys = Object.keys(requiredNamespaces);
    if (keys.length === 0) {
      throw new Error(
        [
          '😈 FunnyDevil Wallet: The dApp did not request any chains or methods.',
          '',
          'This usually means the dApp is not EVM-compatible, is misconfigured, or is requesting a custom chain.',
          'If you are connecting to a major dApp (like Uniswap), it may be requesting multiple chains or using a new WalletConnect feature.',
          '',
          'Make sure you are using a supported dApp and that it is requesting Ethereum (eip155) or compatible chains.',
          '',
          'If you believe this is an error, please report it to the FunnyDevil Wallet project with details about the dApp and the QR code/URI you used.'
        ].join('\n')
      );
    }
    nsKey = keys[0];
  }
  const ns = requiredNamespaces[nsKey];
  if (!ns) throw new Error(`FunnyDevil only supports EVM-compatible dApps (eip155). Namespace '${nsKey}' not found in proposal.`);
  await web3wallet.approveSession({
    id: proposal.id,
    namespaces: {
      [nsKey]: {
        accounts: [`${nsKey}:1:${address}`],
        methods: ns.methods,
        events: ns.events,
      },
    },
  });
}
