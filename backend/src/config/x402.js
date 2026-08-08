// backend/src/config/x402.js

export const x402Config = {
  // Environment (testnet or mainnet)
  env: process.env.X402_ENV || 'testnet',

  // Network and Token Settings
  network: process.env.X402_ENV === 'mainnet' ? 'base-mainnet' : 'base-sepolia',
  token: 'USDC',
  
  // Wallet to receive funds
  recipientAddress: process.env.X402_RECIPIENT_ADDRESS || '0xYourWalletAddressHere',

  // Pricing Model (Cost per endpoint in USDC)
  // If an endpoint is not in this list, it is not protected by the paywall
  // Note: you can use wildcard-like matching if implemented in middleware, 
  // but for now we'll match exact paths or base paths.
  pricing: {
    '/api/replay': 0.10,
    '/api/dashboard': 0.15,
    '/api/hydro': 0.20,
    '/api/planner': 0.50,
    '/api/actions': 0.30,
    '/api/alerts': 0.05,
    '/api/agentic-plan': 1.00,
    '/api/proxy': 0.01
  },

  // Facilitator settings
  facilitatorUrl: process.env.X402_FACILITATOR_URL || 'https://mock-facilitator.example.com',
  facilitatorApiKey: process.env.X402_FACILITATOR_API_KEY || 'mock-api-key',
};
