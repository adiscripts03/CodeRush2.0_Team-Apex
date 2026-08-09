// frontend/src/components/WalletButton.jsx
// Compact wallet connect/disconnect button for the navbar.

import React from 'react';
import { useWallet } from '../lib/walletContext';
import { Wallet, LogOut, AlertTriangle, Loader2 } from 'lucide-react';

export default function WalletButton() {
  const {
    address,
    chainId,
    isConnected,
    isConnecting,
    isCorrectChain,
    error,
    hasEthereum,
    targetChain,
    connect,
    disconnect,
  } = useWallet();

  // Truncate address for display
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const chainName = isCorrectChain ? targetChain.name : `Chain ${chainId}`;

  if (!hasEthereum) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-300 hover:bg-amber-200 transition-colors"
        title="Install MetaMask or Coinbase Wallet"
      >
        <Wallet className="w-3.5 h-3.5" />
        <span>Install Wallet</span>
      </a>
    );
  }

  if (isConnecting) {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 text-slate-500 text-xs font-semibold border border-slate-300"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Connecting...</span>
      </button>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        {/* Chain indicator */}
        {!isCorrectChain && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-100 text-red-700 text-[10px] font-bold border border-red-300">
            <AlertTriangle className="w-3 h-3" />
            Wrong Network
          </span>
        )}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-300">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{displayAddress}</span>
          <span className="text-emerald-600 text-[10px]">({chainName})</span>
        </div>
        <button
          onClick={disconnect}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 transition-colors"
          title="Disconnect wallet"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold border border-indigo-700 transition-colors"
    >
      <Wallet className="w-3.5 h-3.5" />
      <span>Connect Wallet</span>
    </button>
  );
}
