import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import profileRoutes from './api/profileRoutes.js';
import jobRoutes from './api/jobRoutes.js';
import automationRoutes from './api/automationRoutes.js';
import { wsManager } from './websocket/websocketServer.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/automation', automationRoutes);

// Create HTTP server and initialize WebSocket
const server = createServer(app);
wsManager.initialize(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}/ws`);
  console.log(`API endpoints:`);
  console.log(`  - GET  /health`);
  console.log(`  - GET  /api/profile`);
  console.log(`  - PUT  /api/profile`);
  console.log(`  - GET  /api/jobs`);
  console.log(`  - PATCH /api/jobs/:id/status`);
  console.log(`  - POST /api/jobs/:id/apply`);
  console.log(`  - POST /api/automation/start`);
  console.log(`  - POST /api/automation/confirm`);
  console.log(`  - POST /api/automation/cancel`);
  console.log(`  - POST /api/automation/kill`);
  console.log(`  - GET  /api/automation/sessions`);
});
