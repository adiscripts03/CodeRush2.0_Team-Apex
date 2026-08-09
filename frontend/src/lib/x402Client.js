// frontend/src/lib/x402Client.js
// x402 v2 payment-aware fetch client
//
// Wraps fetch() to automatically detect HTTP 402 responses,
// request payment via the user's browser wallet, and retry.
//
// Anti-loop protection: each request gets at most ONE payment retry.
// Payment signing uses the browser wallet (no private keys in the app).

// Payment state callbacks for UI feedback
let _onPaymentRequired = null;
let _onPaymentComplete = null;
let _onPaymentError = null;
let _walletClientGetter = null;

/**
 * Configure the x402 client with callback hooks.
 * Called once during app initialization.
 */
export function configureX402Client({
  onPaymentRequired,
  onPaymentComplete,
  onPaymentError,
  getWalletClient,
}) {
  _onPaymentRequired = onPaymentRequired;
  _onPaymentComplete = onPaymentComplete;
  _onPaymentError = onPaymentError;
  _walletClientGetter = getWalletClient;
}

/**
 * Payment-aware fetch wrapper.
 *
 * Flow:
 * 1. Make the original request
 * 2. If 402 → parse payment requirements
 * 3. Request wallet signature
 * 4. Retry with X-PAYMENT header
 * 5. Return final response
 *
 * @param {string} url - Request URL
 * @param {Object} options - fetch options
 * @returns {Promise<Response>}
 */
export async function x402Fetch(url, options = {}) {
  // Make the initial request
  let response = await fetch(url, options);

  // If not 402, return as-is
  if (response.status !== 402) {
    return response;
  }

  console.log('[x402-client] 402 Payment Required detected');

  // Parse payment requirements from the PAYMENT-REQUIRED header
  let paymentRequirements;
  try {
    const headerVal = response.headers.get('PAYMENT-REQUIRED') || response.headers.get('x-payment-required');
    if (headerVal) {
      paymentRequirements = JSON.parse(atob(headerVal));
    } else {
      // Fallback to body parsing if header is missing
      paymentRequirements = await response.json();
    }
    console.log('[x402-client] Payment requirements:', JSON.stringify(paymentRequirements, null, 2));
  } catch (err) {
    console.error('[x402-client] Failed to parse 402 response:', err);
    throw new Error('Failed to parse payment requirements from 402 response.');
  }

  // Notify UI that payment is required
  if (_onPaymentRequired) {
    _onPaymentRequired(paymentRequirements);
  }

  // Get the wallet client
  const walletInfo = _walletClientGetter ? _walletClientGetter() : null;
  if (!walletInfo || !walletInfo.address) {
    const error = new Error('Wallet not connected. Please connect your wallet to make payments.');
    error.code = 'WALLET_NOT_CONNECTED';
    if (_onPaymentError) _onPaymentError(error);
    throw error;
  }

  try {
    console.log('[x402-client] Requesting wallet signature...');

    // The x402 protocol requires the client to sign an EIP-712 typed data payload
    // or create a payment authorization. The exact format depends on the payment scheme.
    // For the 'exact' EVM scheme, we need to sign an EIP-3009 transferWithAuthorization.
    //
    // The 402 response from @x402/express includes the payment requirements in a format
    // that tells the client exactly what to sign. We pass this through to the wallet.
    const paymentPayload = await createPaymentSignature(
      walletInfo,
      paymentRequirements
    );

    if (!paymentPayload) {
      const error = new Error('Payment was cancelled or failed.');
      error.code = 'PAYMENT_CANCELLED';
      if (_onPaymentError) _onPaymentError(error);
      throw error;
    }

    // Retry the original request with the payment header
    console.log('[x402-client] Retrying request with payment...');
    const retryHeaders = new Headers(options.headers || {});
    retryHeaders.set('X-PAYMENT', paymentPayload);

    const retryOptions = { ...options, headers: retryHeaders };
    response = await fetch(url, retryOptions);

    // Check if the retry also returned 402 (anti-loop: don't retry again)
    if (response.status === 402) {
      const error = new Error('Payment was rejected by the server. The payment may be invalid, expired, or insufficient.');
      error.code = 'PAYMENT_REJECTED';
      if (_onPaymentError) _onPaymentError(error);
      throw error;
    }

    console.log('[x402-client] Payment accepted, response received');
    if (_onPaymentComplete) _onPaymentComplete();

    return response;
  } catch (err) {
    if (err.code === 'PAYMENT_CANCELLED' || err.code === 'PAYMENT_REJECTED' || err.code === 'WALLET_NOT_CONNECTED') {
      throw err;
    }

    // Handle wallet rejection
    if (err.code === 4001 || err.message?.includes('rejected') || err.message?.includes('denied')) {
      const error = new Error('Payment cancelled by user.');
      error.code = 'USER_REJECTED';
      if (_onPaymentError) _onPaymentError(error);
      throw error;
    }

    console.error('[x402-client] Payment error:', err);
    const error = new Error(`Payment failed: ${err.message}`);
    error.code = 'PAYMENT_FAILED';
    if (_onPaymentError) _onPaymentError(error);
    throw error;
  }
}

/**
 * Create a payment signature using the browser wallet.
 *
 * For the x402 v2 'exact' EVM scheme, this involves signing
 * EIP-712 typed data (EIP-3009 transferWithAuthorization).
 *
 * The 402 response body from @x402/express contains the payment
 * details needed to construct the authorization.
 *
 * @param {Object} walletInfo - { address, walletClient }
 * @param {Object} requirements - Payment requirements from 402 response
 * @returns {Promise<string>} Base64-encoded payment payload for X-PAYMENT header
 */
async function createPaymentSignature(walletInfo, requirements) {
  const { address, walletClient } = walletInfo;

  if (!walletClient) {
    throw new Error('Wallet client not available');
  }

  // The x402 v2 402 response typically contains:
  // - accepts: array of accepted payment schemes
  // - Each scheme has: price, network, payTo, extra, scheme
  //
  // For the EVM exact scheme, we need to sign EIP-3009 transferWithAuthorization
  // The payment payload format expected by the server:
  // Base64 encoded JSON with: { scheme, network, payload: { signature, authorization } }

  const accepts = requirements.accepts || requirements.x402 || [];
  
  // Find an EVM-compatible payment option
  let paymentOption = null;
  if (Array.isArray(accepts)) {
    paymentOption = accepts.find(a => 
      a.network?.startsWith('eip155:') && a.scheme === 'exact'
    );
    if (!paymentOption && accepts.length > 0) {
      paymentOption = accepts[0]; // Fall back to first option
    }
  }

  if (!paymentOption) {
    // If the response is in a different format, try to use it directly
    if (requirements.network && requirements.price) {
      paymentOption = requirements;
    } else {
      throw new Error('No compatible payment option found in 402 response.');
    }
  }

  console.log('[x402-client] Payment option:', paymentOption);

  // For the EVM exact scheme, we need to construct and sign an EIP-3009
  // transferWithAuthorization message
  const validAfter = 0;
  const validBefore = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const nonce = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  // Parse the price to get the amount in atomic units
  let amountAtomic;
  let priceNum = 0;
  if (paymentOption.amount) {
    amountAtomic = BigInt(paymentOption.amount);
    priceNum = Number(amountAtomic) / 1_000_000;
  } else {
    const priceStr = paymentOption.price || paymentOption.maxAmountRequired || '0';
    priceNum = parseFloat(priceStr.replace('$', ''));
    amountAtomic = BigInt(Math.round(priceNum * 1_000_000)); // USDC 6 decimals
  }

  // USDC contract address
  const usdcAddress = paymentOption.extra?.asset 
    || paymentOption.asset
    || '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia USDC default

  const payTo = paymentOption.payTo || paymentOption.recipient || '';

  // Determine chain ID from network string (e.g., "eip155:84532" → 84532)
  const networkStr = paymentOption.network || '';
  const chainId = parseInt(networkStr.split(':')[1] || '84532', 10);

  // EIP-712 domain for USDC transferWithAuthorization (EIP-3009)
  const domain = {
    name: 'USD Coin',
    version: '2',
    chainId: chainId,
    verifyingContract: usdcAddress,
  };

  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  };

  const message = {
    from: address,
    to: payTo,
    value: amountAtomic,
    validAfter: BigInt(validAfter),
    validBefore: BigInt(validBefore),
    nonce: nonce,
  };

  console.log('[x402-client] Signing EIP-712 transferWithAuthorization...');
  console.log('[x402-client] From:', address);
  console.log('[x402-client] To:', payTo);
  console.log('[x402-client] Amount:', priceNum, 'USDC (', amountAtomic.toString(), 'atomic)');

  // Request the wallet to sign EIP-712 typed data
  const signature = await walletClient.signTypedData({
    account: address,
    domain,
    types,
    primaryType: 'TransferWithAuthorization',
    message,
  });

  console.log('[x402-client] Signature obtained');

  // Build the x402 payment payload
  // The server expects a base64-encoded JSON string in the X-PAYMENT header
  const paymentPayload = {
    scheme: 'exact',
    network: networkStr,
    payload: {
      signature,
      authorization: {
        from: address,
        to: payTo,
        value: '0x' + amountAtomic.toString(16),
        validAfter: validAfter,
        validBefore: validBefore,
        nonce: nonce,
      },
    },
  };

  // Base64 encode the payload
  const encoded = btoa(JSON.stringify(paymentPayload));
  return encoded;
}
