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

  const startListening = (port) => {
    const onError = (error) => {
      if ((error.code === 'EADDRINUSE' || error.code === 'EPERM') && port < 5020) {
        const nextPort = port + 1;
        console.warn(`⚠️ Port ${port} is unavailable (${error.code}). Trying ${nextPort} instead...`);
        server.removeListener('error', onError);
        server.close(() => startListening(nextPort));
      } else {
        throw error;
      }
    };

    server.on('error', onError);

    server.listen(port, env.host, () => {
      console.log(`
        🚀 Server is running on port ${port}
        🌍 Environment: ${env.nodeEnv}
        ✅ Health check: http://${env.host}:${port}/health
      `);
    });
  };

  startListening(Number(env.port));
};

startServer();
