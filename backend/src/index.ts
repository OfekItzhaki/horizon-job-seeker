// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: join(__dirname, '../.env') });

// Now import everything else
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import profileRoutes from './api/profileRoutes.js';
import jobRoutes from './api/jobRoutes.js';
import automationRoutes from './api/automationRoutes.js';
import { wsManager } from './websocket/websocketServer.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Debug: Log environment variables
console.log('Environment check:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'NOT SET');
console.log('PORT:', process.env.PORT);

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
