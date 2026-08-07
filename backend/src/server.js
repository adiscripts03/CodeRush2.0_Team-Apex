import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSockets } from './sockets/socketManager.js';

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust this in production
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Initialize our centralized socket manager
initSockets(io);

// Start the server
const startServer = async () => {
  // Connect to the database first
  // Note: If you don't have a Mongo URI yet, you can comment this out to run locally
  if (env.mongoUri) {
    await connectDB();
  } else {
    console.warn('⚠️ MONGO_URI is missing. Running without database connection for now.');
  }

  // Start listening
  server.listen(env.port, () => {
    console.log(`
      🚀 Server is running on port ${env.port}
      🌍 Environment: ${env.nodeEnv}
      ✅ Health check: http://localhost:${env.port}/health
    `);
  });
};

startServer();
