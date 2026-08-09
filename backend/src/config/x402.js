// backend/src/config/x402.js
// Centralized x402 v2 payment protocol configuration
//
// Price format: '$X.XX' string — the SDK handles atomic conversion internally.
// USDC has 6 decimals: $0.01 = 10,000 atomic units

/**
 * x402 v2 configuration — all settings driven by environment variables
 * with safe defaults for Base Sepolia testnet development.
 */

// Determine environment
const networkId = process.env.X402_NETWORK || 'eip155:84532';
const isProduction = networkId === 'eip155:8453';

// Official x402 facilitator URLs
const defaultFacilitatorUrl = isProduction
  ? 'https://facilitator.goplausible.xyz'
  : 'https://facilitator.goplausible.xyz';

export const x402Config = {
  // Master toggle — set to 'false' to disable payment protection entirely
  enabled: process.env.X402_ENABLED !== 'false',

  // CAIP-2 network identifier
  network: networkId,

  // Wallet address to receive payments
  payTo: process.env.X402_PAY_TO || '',

  // x402 facilitator URL for payment verification and settlement
  facilitatorUrl: process.env.X402_FACILITATOR_URL || defaultFacilitatorUrl,

  // Whether this is a production deployment
  isProduction,

  // ─────────────────────────────────────────────────────────────
  // CENTRALIZED PRICING MAP
  // ─────────────────────────────────────────────────────────────
  // Prices in USD (USDC). Format: '$X.XX' string.
  // Every API route group is listed here. To change a price,
  // update the value here — no other file needs to change.
  //
  // Routes not listed here are NOT payment-protected.
  // ─────────────────────────────────────────────────────────────
  pricing: {
    '/api/replay':       '$0.10',
    '/api/dashboard':    '$0.15',
    '/api/hydro':        '$0.20',
    '/api/planner':      '$0.50',
    '/api/actions':      '$0.30',
    '/api/alerts':       '$0.05',
    '/api/agentic-plan': '$1.00',
    '/api/proxy':        '$0.01',
  },
};

/**
 * Build the route payment config in the format expected by @x402/express.
 *
 * Format (matching the Hono demo that works with @x402/hono):
 *   { "METHOD /path": { accepts: [{ scheme, price, network, payTo }], description } }
 *
 * For Express, the routes are matched as "* /path" (any method) with wildcard sub-paths.
 */
export function buildRoutePaymentConfig() {
  const config = {};
  const network = x402Config.network;
  const payTo = x402Config.payTo;

  for (const [route, price] of Object.entries(x402Config.pricing)) {
    // Use wildcard method matching
    const routeKey = `* ${route}`;
    config[routeKey] = {
      accepts: [
        {
          scheme: 'exact',
          price,
          network,
          payTo,
        },
      ],
      description: `Access to ${route} — ${price} USDC`,
    };

    // Also protect sub-paths (e.g. /api/replay/frame/1)
    const subRouteKey = `* ${route}/*`;
    config[subRouteKey] = {
      accepts: [
        {
          scheme: 'exact',
          price,
          network,
          payTo,
        },
      ],
      description: `Access to ${route}/* — ${price} USDC`,
    };
  }

  return config;
}

export default x402Config;
