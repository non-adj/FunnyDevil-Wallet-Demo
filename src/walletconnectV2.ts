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

let web3wallet: InstanceType<typeof Web3Wallet> | null = null;

export async function initWeb3Wallet(metadata: Web3WalletTypes.Metadata) {
  if (web3wallet) return web3wallet;
  web3wallet = await Web3Wallet.init({
    projectId: WALLETCONNECT_PROJECT_ID,
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
  await web3wallet.approveSession({
    id: proposal.id,
    namespaces: {
      eip155: {
        accounts: [`eip155:1:${address}`],
        methods: proposal.params.requiredNamespaces.eip155.methods,
        events: proposal.params.requiredNamespaces.eip155.events,
      },
    },
  });
}
