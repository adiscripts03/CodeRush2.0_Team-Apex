# x402 Payment Wrapper for Backend API

This repository includes an implementation of the **x402 payment protocol** for monetizing backend API endpoints using cryptocurrency (stablecoins).

## What it does

When a client makes a request to a protected endpoint (like `/api/agentic-plan`):
1. **Backend**: The `x402Middleware` intercepts the request. If no valid `X-PAYMENT` header is present, it responds with `402 Payment Required` along with the payment requirements (amount, token, recipient, chain).
2. **Frontend**: The `x402Fetch` wrapper intercepts the `402` response, automatically prompts the user/wallet to make a payment, constructs the `X-PAYMENT` header (containing the transaction hash or receipt), and retries the original request.
3. **Backend**: The middleware validates the payment via the facilitator. If valid, the request proceeds to the actual endpoint handler.

## Setup & Configuration

### Backend

The core configuration lives in `backend/src/config/x402.js`.
Here you can:
- Map endpoints to their price in USDC.
- Set the receiving wallet address (`recipientAddress`).
- Switch between `testnet` (Base Sepolia) and `mainnet` (Base Mainnet).

To test locally without spending real funds:
1. Keep the environment as `testnet`.
2. The frontend `x402Fetch` is configured with a mocked payment mechanism that simulates a wallet transaction and returns a mock transaction hash (`mock_tx_hash_...`).
3. The backend `verifyAndSettle` service accepts this mock hash when running in `testnet` mode.

### Production Readiness

Before deploying to production (mainnet):
1. Update `backend/src/config/x402.js`:
   - Set `env` to `mainnet` (or set `X402_ENV=mainnet` in your `.env`).
   - Add your actual `recipientAddress` (or `X402_RECIPIENT_ADDRESS`).
   - Configure your facilitator URL and API key (`X402_FACILITATOR_URL`, `X402_FACILITATOR_API_KEY`).
2. Update `backend/src/services/facilitator.js`:
   - Uncomment the actual HTTP call to your facilitator (e.g., Coinbase's x402 facilitator API) to verify real blockchain transactions.
3. Update `frontend/src/lib/x402Client.js`:
   - Replace the `processPayment` mock with an actual Web3 provider call (e.g., using `ethers.js` or `viem` to prompt MetaMask/Coinbase Wallet to send a transaction).

## Protected Endpoints

Currently configured endpoints and their prices:
- `/api/replay`: 0.10 USDC
- `/api/dashboard`: 0.15 USDC
- `/api/hydro`: 0.20 USDC
- `/api/planner`: 0.50 USDC
- `/api/actions`: 0.30 USDC
- `/api/alerts`: 0.05 USDC
- `/api/agentic-plan`: 1.00 USDC
- `/api/proxy`: 0.01 USDC

If you add a new endpoint, simply add it to the `pricing` object in `backend/src/config/x402.js` to protect it.
