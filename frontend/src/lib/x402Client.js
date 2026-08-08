// frontend/src/lib/x402Client.js

/**
 * A wrapper around native `fetch` that automatically handles 
 * x402 Payment Required responses.
 * 
 * If a 402 is returned, it prompts the user/wallet for payment 
 * according to the requirements, constructs the X-PAYMENT header,
 * and retries the original request.
 */
export async function x402Fetch(url, options = {}) {
  // First, make the request as normal
  let response = await fetch(url, options);

  // If we receive a 402 Payment Required, we need to handle payment
  if (response.status === 402) {
    const data = await response.json();
    
    if (data.requirements) {
      console.log('[x402-client] 402 Payment Required. Requirements:', data.requirements);
      
      // Perform the payment (Mocked for now)
      const txHash = await processPayment(data.requirements);
      
      if (!txHash) {
        throw new Error('Payment was cancelled or failed.');
      }

      // Reconstruct headers with X-PAYMENT included
      const headers = new Headers(options.headers || {});
      headers.set('X-PAYMENT', txHash);
      
      const newOptions = { ...options, headers };
      
      console.log('[x402-client] Retrying request with X-PAYMENT header...');
      // Retry the request with the payment proof
      response = await fetch(url, newOptions);
    }
  }

  return response;
}

/**
 * Mocks a payment transaction for development purposes.
 * In a real scenario, this would use ethers.js/viem to prompt MetaMask 
 * or another Web3 wallet to send funds to the requirements.recipient address.
 * 
 * @param {Object} reqs - { amount, token, chain, recipient }
 * @returns {Promise<string>} - The transaction hash or signature to be placed in X-PAYMENT
 */
async function processPayment(reqs) {
  // Simulate delay for user approval and network transaction
  return new Promise((resolve) => {
    console.log(`[x402-client] Prompting user to pay ${reqs.amount} ${reqs.token} on ${reqs.chain}...`);
    setTimeout(() => {
      // Return a mocked tx hash that our backend facilitator is expecting
      const mockTxHash = `mock_tx_hash_${reqs.amount}_${reqs.token}`;
      console.log(`[x402-client] Payment successful! Tx: ${mockTxHash}`);
      resolve(mockTxHash);
    }, 1500); // 1.5 seconds mock delay
  });
}
