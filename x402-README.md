# x402 v2 Payment Integration

This application is fully integrated with the **x402 v2 payment protocol**. All critical API endpoints are protected by an autonomous stablecoin micropayment gateway.

## Architecture

- **Backend Middleware**: Uses the official `@x402/express` middleware mounted in `app.js`.
- **Frontend Client**: Uses a custom `x402Fetch` wrapper (`lib/x402Client.js`) that automatically intercepts `HTTP 402` responses, parses the `PAYMENT-REQUIRED` header, requests a signature from the user's browser wallet via `viem`, and retries the request with the `X-PAYMENT` header.
- **Payment Scheme**: EVM Exact Scheme (EIP-3009 `transferWithAuthorization`).
- **Facilitator**: `https://facilitator.goplausible.xyz`

## Environment Configuration

Set the following in your `backend/.env` file:

```env
# Enable/disable payment protection
X402_ENABLED=true

# Network (CAIP-2 identifier) — defaults to Base Sepolia
X402_NETWORK=eip155:84532

# Your receiving wallet address (MUST BE CONFIGURED)
X402_PAY_TO=0xYourWalletAddress

# Facilitator URL
X402_FACILITATOR_URL=https://facilitator.goplausible.xyz
```

## Pricing Configuration

All API pricing is centralized in `backend/src/config/x402.js`. 
To change a price, modify the `pricing` map in that file.

```javascript
  pricing: {
    '/api/replay':       '$0.10',
    '/api/dashboard':    '$0.15',
    '/api/hydro':        '$0.20',
    '/api/planner':      '$0.50',
    '/api/actions':      '$0.30',
    '/api/alerts':       '$0.05',
    '/api/agentic-plan': '$1.00',
    '/api/proxy':        '$0.01',
  }
```

## How to Test

1. Add your `X402_PAY_TO` address in `backend/.env`.
2. Start the backend (`npm start`) and frontend (`npm run dev`).
3. Connect a MetaMask or Coinbase Wallet on the **Base Sepolia** network to the frontend.
4. Attempt to use a protected feature (e.g., clicking "Agentic Plan" in the Response Planner).
5. The `PaymentModal` will appear and prompt your wallet for an EIP-712 signature.
6. Once signed, the client retries the request, the backend verifies it with the facilitator, and the API successfully executes.
