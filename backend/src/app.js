import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { x402PaymentMiddleware } from './middleware/x402.js';
import replayRoutes from './routes/replayRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import hydroRoutes from './routes/hydroRoutes.js';
import plannerRoutes from './routes/plannerRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import agenticRoutes from './routes/agenticRoutes.js';
import proxyRoutes from './routes/proxyRoutes.js';

const app = express();

// ─────────────────────────────────────────────────────────────
// 1. CORS — must be first to handle browser preflight requests
// ─────────────────────────────────────────────────────────────
// x402 v2 uses the X-PAYMENT request header and may include
// payment-related response headers. These must be explicitly
// allowed/exposed for browser fetch to work.
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-PAYMENT',           // x402 payment header (request)
    'X-Requested-With',
  ],
  exposedHeaders: [
    'X-PAYMENT',           // x402 payment header
    'X-PAYMENT-RESPONSE',  // x402 payment response
  ],
  credentials: true,
  maxAge: 86400,
}));

// ─────────────────────────────────────────────────────────────
// 2. Body parsing
// ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────
// 3. Health check — FREE, no payment required
// ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Disaster Command Backend is running seamlessly.',
    timestamp: new Date().toISOString()
  });
});

// ─────────────────────────────────────────────────────────────
// 4. x402 payment middleware
//    Sits BEFORE route handlers so payment is verified first.
//    Architecture: CORS → JSON → x402 → Routes → Error Handler
// ─────────────────────────────────────────────────────────────
app.use(x402PaymentMiddleware);

// ─────────────────────────────────────────────────────────────
// 5. API Routes — business logic unchanged
//    These handlers execute ONLY after x402 payment is verified.
// ─────────────────────────────────────────────────────────────
app.use('/api/replay', replayRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/hydro', hydroRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/actions', approvalRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/agentic-plan', agenticRoutes);
app.use('/api/proxy', proxyRoutes);

// ─────────────────────────────────────────────────────────────
// 6. Error handling
// ─────────────────────────────────────────────────────────────
// Catch 404 and forward to error handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
