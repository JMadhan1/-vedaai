import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { connectDB } from './config/database.js';
import { initializeRedis } from './config/redis.js';
import { initializeQueue } from './services/queueService.js';
import { startWorker } from './workers/generationWorker.js';
import assignmentRoutes from './routes/assignments.js';
import paperRoutes from './routes/papers.js';
import { registerClient, unregisterClient, getClientsMap } from './services/broadcastService.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb' }));

// Initialize databases and queue
let isReady = false;

async function initialize() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected');

    console.log('🔄 Connecting to Redis...');
    await initializeRedis();
    console.log('✅ Redis connected');

    console.log('🔄 Initializing BullMQ...');
    await initializeQueue();
    console.log('✅ BullMQ initialized');

    console.log('🔄 Starting generation worker...');
    await startWorker();
    console.log('✅ Generation worker started');

    isReady = true;
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: isReady ? 'ready' : 'initializing' });
});

// Routes
app.use('/api/assignments', assignmentRoutes);
app.use('/api/papers', paperRoutes);

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'subscribe' && message.assignmentId) {
        registerClient(message.assignmentId, ws);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    unregisterClient(ws);
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Export for queue to use
export { broadcast as broadcastToAssignment } from './services/broadcastService.js';

// Start server
initialize().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});

export default app;
