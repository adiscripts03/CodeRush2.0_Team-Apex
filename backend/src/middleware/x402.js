// backend/src/middleware/x402.js
import { x402Config } from '../config/x402.js';
import { verifyAndSettle } from '../services/facilitator.js';

export async function x402Middleware(req, res, next) {
  // 1. Determine if route is protected
  // We check if the request URL starts with any of our priced routes
  let matchedRoute = null;
  for (const route of Object.keys(x402Config.pricing)) {
    if (req.path.startsWith(route)) {
      matchedRoute = route;
      break;
    }
  }

  // If not in pricing config, it's a free route, pass through
  if (!matchedRoute) {
    return next();
  }

  const requiredAmount = x402Config.pricing[matchedRoute];
  
  // 2. Define payment requirements
  const requirements = {
    amount: requiredAmount,
    token: x402Config.token,
    chain: x402Config.network,
    recipient: x402Config.recipientAddress,
    resourceId: req.originalUrl
  };

  // 3. Check for X-PAYMENT header
  const paymentHeader = req.headers['x-payment'];

  if (!paymentHeader) {
    // Return 402 Payment Required with requirements
    return res.status(402).json({
      error: 'Payment Required',
      message: 'This endpoint requires x402 payment in stablecoin.',
      requirements
    });
  }

  // 4. Validate payment
  const isValid = await verifyAndSettle(paymentHeader, requirements);

  if (!isValid) {
    return res.status(401).json({
      error: 'Invalid Payment',
      message: 'The provided X-PAYMENT header is invalid, expired, or insufficient.',
    });
  }

  // 5. Log receipt/successful payment
  console.log(`[x402-receipt] Payment successful | Route: ${matchedRoute} | Amount: ${requiredAmount} ${x402Config.token} | Tx: ${paymentHeader}`);

  // 6. Pass to next handler
  next();
}
