// frontend/src/lib/walletContext.jsx
// React context for wallet connection state
//
// Provides wallet connectivity using viem + window.ethereum (MetaMask/Coinbase Wallet).
// No private keys are ever handled — all signing is done by the browser wallet.

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createWalletClient, custom, createPublicClient, http } from 'viem';
import { baseSepolia, base } from 'viem/chains';

// Chain configuration based on environment
const TARGET_CHAIN_ID = import.meta.env.VITE_X402_NETWORK === 'eip155:8453'
  ? 8453   // Base Mainnet
  : 84532; // Base Sepolia (default for dev)

const TARGET_CHAIN = TARGET_CHAIN_ID === 8453 ? base : baseSepolia;

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [walletClient, setWalletClient] = useState(null);

  const isConnected = !!address;
  const isCorrectChain = chainId === TARGET_CHAIN_ID;

  // Check if ethereum provider is available
  const hasEthereum = typeof window !== 'undefined' && !!window.ethereum;

  // Create wallet client from connected account
  const createClient = useCallback((account) => {
    if (!window.ethereum) return null;
    return createWalletClient({
      account,
      chain: TARGET_CHAIN,
      transport: custom(window.ethereum),
    });
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('No wallet detected. Please install MetaMask or Coinbase Wallet.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from wallet.');
      }

      const account = accounts[0];
      setAddress(account);

      // Get current chain ID
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainIdHex, 16);
      setChainId(currentChainId);

      // Create wallet client
      const client = createClient(account);
      setWalletClient(client);

      // Switch to target chain if not already on it
      if (currentChainId !== TARGET_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${TARGET_CHAIN_ID.toString(16)}` }],
          });
          setChainId(TARGET_CHAIN_ID);
        } catch (switchError) {
          // Chain not added — try adding it
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: `0x${TARGET_CHAIN_ID.toString(16)}`,
                  chainName: TARGET_CHAIN.name,
                  nativeCurrency: TARGET_CHAIN.nativeCurrency,
                  rpcUrls: [TARGET_CHAIN.rpcUrls.default.http[0]],
                  blockExplorerUrls: [TARGET_CHAIN.blockExplorers.default.url],
                }],
              });
              setChainId(TARGET_CHAIN_ID);
            } catch (addError) {
              console.warn('[wallet] Failed to add chain:', addError);
            }
          } else {
            console.warn('[wallet] Failed to switch chain:', switchError);
          }
        }
      }
    } catch (err) {
      console.error('[wallet] Connection failed:', err);
      if (err.code === 4001) {
        setError('Wallet connection rejected by user.');
      } else {
        setError(err.message || 'Failed to connect wallet.');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [createClient]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setWalletClient(null);
    setError(null);
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
        const client = createClient(accounts[0]);
        setWalletClient(client);
      }
    };

    const handleChainChanged = (chainIdHex) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [createClient, disconnect]);

  // Auto-reconnect if previously connected
  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        const client = createClient(accounts[0]);
        setWalletClient(client);

        window.ethereum.request({ method: 'eth_chainId' }).then((chainIdHex) => {
          setChainId(parseInt(chainIdHex, 16));
        });
      }
    }).catch(() => {});
  }, [createClient]);

  const value = {
    address,
    chainId,
    isConnected,
    isConnecting,
    isCorrectChain,
    error,
    walletClient,
    targetChainId: TARGET_CHAIN_ID,
    targetChain: TARGET_CHAIN,
    hasEthereum,
    connect,
    disconnect,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
