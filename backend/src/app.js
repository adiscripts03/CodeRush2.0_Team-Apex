import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import replayRoutes from './routes/replayRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import hydroRoutes from './routes/hydroRoutes.js';
import plannerRoutes from './routes/plannerRoutes.js';
import approvalRoutes from './routes/approvalRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import agenticRoutes from './routes/agenticRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Disaster Command Backend is running seamlessly.',
    timestamp: new Date().toISOString()
  });
});

// Placeholder for API routes (to be added later)
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/sensors', sensorRoutes);
// app.use('/api/v1/alerts', alertRoutes);
app.use('/api/replay', replayRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/hydro', hydroRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/actions', approvalRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/agentic-plan', agenticRoutes);

// Catch 404 and forward to error handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
