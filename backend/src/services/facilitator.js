// backend/src/services/facilitator.js
//
// DEPRECATED: This file is no longer used.
//
// x402 v2 payment verification and settlement is now handled by the official
// @x402/express middleware, which internally uses @x402/core's HTTPFacilitatorClient.
//
// The facilitator URL is configured via X402_FACILITATOR_URL in .env
// and consumed by the middleware in middleware/x402.js.
//
// Testnet:    https://facilitator.x402.org
// Production: https://facilitator.cdp.coinbase.com
//
// This file is kept for reference only. It can be safely deleted.

export async function verifyAndSettle() {
  throw new Error(
    'verifyAndSettle() is deprecated. ' +
    'Payment verification is now handled by @x402/express middleware. ' +
    'See middleware/x402.js'
  );
}
