// backend/src/middleware/x402.js
// x402 v2 payment middleware using the official @x402/express SDK
//
// This middleware intercepts requests to protected API routes, returns
// HTTP 402 with payment requirements if no valid payment is present,
// verifies/settles payments via the facilitator, and only then allows
// the request through to the route handler.

import { paymentMiddlewareFromConfig } from '@x402/express';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import x402Config, { buildRoutePaymentConfig } from '../config/x402.js';

/**
 * Creates and returns the x402 v2 payment middleware for Express.
 *
 * The official @x402/express middleware handles:
 * - 402 Payment Required responses with payment challenge
 * - Payment verification via facilitator
 * - Payment settlement
 * - Payment response headers
 * - Invalid/expired/insufficient/wrong-network payment rejection
 * - Replay protection (already-used payments)
 *
 * @returns {Function} Express middleware function (or pass-through if disabled)
 */
export function createX402Middleware() {
  // If x402 is disabled, return a pass-through middleware
  if (!x402Config.enabled) {
    console.log('[x402] Payment protection is DISABLED (X402_ENABLED=false)');
    return (req, res, next) => next();
  }

  // Validate required configuration
  if (!x402Config.payTo) {
    console.error('[x402] ERROR: X402_PAY_TO is not configured. Cannot start payment middleware.');
    console.error('[x402] Set X402_PAY_TO to your receiving wallet address in .env');
    return (req, res, next) => {
      // Allow health checks through even if misconfigured
      if (req.path === '/health') return next();
      res.status(500).json({
        error: 'Payment system misconfigured',
        message: 'X402_PAY_TO address is not set on the server.',
      });
    };
  }

  // Build the route payment configuration
  const routeConfig = buildRoutePaymentConfig();

  // Log configuration
  console.log('[x402] Payment protection is ENABLED');
  console.log(`[x402] Network: ${x402Config.network}`);
  console.log(`[x402] Pay-to address: ${x402Config.payTo}`);
  console.log(`[x402] Facilitator: ${x402Config.facilitatorUrl}`);
  console.log('[x402] Protected routes:');
  for (const [route, price] of Object.entries(x402Config.pricing)) {
    console.log(`  ${route} → ${price} USDC`);
  }

  // Create the official x402 payment middleware
  // Signature: paymentMiddlewareFromConfig(routes, facilitatorClients, schemes)
  const middleware = paymentMiddlewareFromConfig(
    routeConfig,
    [new HTTPFacilitatorClient({ url: x402Config.facilitatorUrl })],
    [
      {
        network: x402Config.network,
        server: new ExactEvmScheme(),
      }
    ]
  );

  // Wrap with structured logging
  return (req, res, next) => {
    const isApiRoute = req.path.startsWith('/api/');
    if (!isApiRoute) {
      return next();
    }

    // Don't log static/internal requests excessively
    if (req.method !== 'OPTIONS') {
      console.log(`[x402] Request: ${req.method} ${req.path}`);
    }

    if (req.headers['x-payment']) {
      console.log('[x402] Payment header detected, verifying...');
    }

    // Delegate to the official middleware
    middleware(req, res, (...args) => {
      if (req.method !== 'OPTIONS') {
        // If the request passes the middleware, that means payment was valid or not required
        const matchedRoute = Object.keys(x402Config.pricing).find(route =>
          req.path === route || req.path.startsWith(route + '/')
        );
        if (matchedRoute) {
          console.log(`[x402] Payment verified, passing to handler: ${req.method} ${req.path}`);
        } else {
          console.log(`[x402] Unprotected route, passing to handler: ${req.method} ${req.path}`);
        }
      }
      next(...args);
    });
  };
}

// Export a singleton middleware instance
export const x402PaymentMiddleware = createX402Middleware();
