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
import helmet from 'helmet';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import profileRoutes from './api/profileRoutes.js';
import jobRoutes from './api/jobRoutes.js';
import automationRoutes from './api/automationRoutes.js';
import { wsManager } from './websocket/websocketServer.js';
import { logger } from './utils/logger.js';
import { env } from './utils/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = env.PORT;

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(cors());
app.use(express.json());

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     description: Returns the health status of the API and its dependencies
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2026-02-11T12:00:00.000Z
 *                 version:
 *                   type: string
 *                   example: 0.1.0
 *                 environment:
 *                   type: string
 *                   example: development
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: connected
 *                     ai:
 *                       type: string
 *                       example: configured
 */
app.get('/health', async (_req, res) => {
  try {
    // Check database connection
    const { db } = await import('./db/index.js');
    const { sql } = await import('drizzle-orm');
    await db.execute(sql`SELECT 1`);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      environment: env.NODE_ENV,
      services: {
        database: 'connected',
        ai: env.GROQ_API_KEY || env.OPENAI_API_KEY ? 'configured' : 'not configured',
        scrapers: {
          adzuna: env.ADZUNA_APP_ID && env.ADZUNA_API_KEY ? 'configured' : 'not configured',
          linkedin: 'public API',
          rss: 'active',
        },
      },
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      environment: env.NODE_ENV,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Swagger API documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Horizon Job Filer API Docs',
  })
);

// Swagger JSON endpoint
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/automation', automationRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Create HTTP server and initialize WebSocket
const server = createServer(app);
wsManager.initialize(server);

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`WebSocket server running on ws://localhost:${PORT}/ws`);
  logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
  logger.debug('Available endpoints:', {
    health: 'GET /health',
    docs: 'GET /api-docs',
    profile: 'GET/PUT /api/profile',
    jobs: 'GET /api/jobs',
    automation: 'POST /api/automation/*',
  });
});
