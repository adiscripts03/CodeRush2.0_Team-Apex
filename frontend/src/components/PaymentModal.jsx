// frontend/src/components/PaymentModal.jsx
// Payment approval UI overlay for x402 payment flow.
//
// Displays when a 402 Payment Required is detected,
// showing amount, endpoint, status, and error messages.

import React, { useState, useEffect, useCallback } from 'react';
import { configureX402Client } from '../lib/x402Client';
import { useWallet } from '../lib/walletContext';
import { CreditCard, Loader2, CheckCircle2, XCircle, Wallet, ShieldCheck } from 'lucide-react';

// Payment states
const STATES = {
  IDLE: 'idle',
  REQUIRED: 'required',
  CONNECTING: 'connecting',
  SIGNING: 'signing',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function PaymentModal() {
  const { address, isConnected, connect } = useWallet();
  const [state, setState] = useState(STATES.IDLE);
  const [requirements, setRequirements] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [autoHideTimeout, setAutoHideTimeout] = useState(null);

  // Clear auto-hide on unmount
  useEffect(() => {
    return () => {
      if (autoHideTimeout) clearTimeout(autoHideTimeout);
    };
  }, [autoHideTimeout]);

  // Configure the x402 client callbacks
  useEffect(() => {
    configureX402Client({
      onPaymentRequired: (reqs) => {
        setState(STATES.REQUIRED);
        setRequirements(reqs);
        setErrorMessage('');
      },
      onPaymentComplete: () => {
        setState(STATES.SUCCESS);
        // Auto-hide after 2 seconds
        const timeout = setTimeout(() => {
          setState(STATES.IDLE);
          setRequirements(null);
        }, 2000);
        setAutoHideTimeout(timeout);
      },
      onPaymentError: (error) => {
        setState(STATES.ERROR);
        setErrorMessage(error.message || 'Payment failed.');
      },
      getWalletClient: () => {
        if (!isConnected || !address) return null;
        // Return wallet info — the x402Client will use this
        // We need the walletClient from the context, but since we're in a callback,
        // we return the address and let x402Client create the client
        return {
          address,
          walletClient: window._x402WalletClient || null,
        };
      },
    });
  }, [isConnected, address]);

  // Close modal
  const handleClose = useCallback(() => {
    setState(STATES.IDLE);
    setRequirements(null);
    setErrorMessage('');
    if (autoHideTimeout) clearTimeout(autoHideTimeout);
  }, [autoHideTimeout]);

  // Don't render when idle
  if (state === STATES.IDLE) return null;

  // Parse display info from requirements
  const displayInfo = getDisplayInfo(requirements);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">x402 Payment</h3>
            <p className="text-indigo-200 text-xs">Micropayment required for API access</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Payment details */}
          {displayInfo && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Amount</span>
                <span className="text-lg font-bold text-slate-900">{displayInfo.price} USDC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-medium">Network</span>
                <span className="text-xs font-semibold text-slate-700">{displayInfo.network}</span>
              </div>
              {displayInfo.description && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Service</span>
                  <span className="text-xs text-slate-600">{displayInfo.description}</span>
                </div>
              )}
            </div>
          )}

          {/* Status display */}
          <div className="flex items-center gap-3 py-2">
            {state === STATES.REQUIRED && (
              <>
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span className="text-sm text-slate-700">
                  {isConnected
                    ? 'Payment required. Your wallet will prompt for approval.'
                    : 'Connect your wallet to proceed with payment.'}
                </span>
              </>
            )}
            {state === STATES.SIGNING && (
              <>
                <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                <span className="text-sm text-slate-700">Waiting for wallet approval...</span>
              </>
            )}
            {state === STATES.PROCESSING && (
              <>
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                <span className="text-sm text-slate-700">Processing payment...</span>
              </>
            )}
            {state === STATES.SUCCESS && (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-emerald-700 font-semibold">Payment confirmed!</span>
              </>
            )}
            {state === STATES.ERROR && (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-700">{errorMessage}</span>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          {!isConnected && state === STATES.REQUIRED && (
            <button
              onClick={connect}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
            >
              <Wallet className="w-3.5 h-3.5" />
              Connect Wallet
            </button>
          )}

          {(state === STATES.ERROR || state === STATES.REQUIRED) && (
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
            >
              {state === STATES.ERROR ? 'Dismiss' : 'Cancel'}
            </button>
          )}

          {state === STATES.SUCCESS && (
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Parse display-friendly info from the 402 response body.
 */
function getDisplayInfo(requirements) {
  if (!requirements) return null;

  // The @x402/express middleware returns requirements in various formats
  const accepts = requirements.accepts || requirements.x402 || [];
  
  if (Array.isArray(accepts) && accepts.length > 0) {
    const first = accepts[0];
    return {
      price: first.price || first.maxAmountRequired || '?',
      network: formatNetwork(first.network),
      description: requirements.description || '',
    };
  }

  // Fallback for simpler formats
  return {
    price: requirements.price || requirements.amount || '?',
    network: formatNetwork(requirements.network || requirements.chain),
    description: requirements.description || requirements.message || '',
  };
}

function formatNetwork(network) {
  if (!network) return 'Unknown';
  if (network === 'eip155:84532' || network === 'base-sepolia') return 'Base Sepolia (Testnet)';
  if (network === 'eip155:8453' || network === 'base-mainnet') return 'Base Mainnet';
  return network;
}
