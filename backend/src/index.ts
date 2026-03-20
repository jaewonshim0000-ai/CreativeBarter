import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import matchRoutes from './routes/match.routes';
import messageRoutes from './routes/message.routes';
import reviewRoutes from './routes/review.routes';
import skillRoutes from './routes/skill.routes';
import resourceRoutes from './routes/resource.routes';
import barterChainRoutes from './routes/barter-chain.routes';
import creditsRoutes from './routes/credits.routes';
import communityRoutes from './routes/community.routes';

// Socket handler
import { setupSocketHandlers } from './services/socket.service';

// ============================================================
// Express App Setup
// ============================================================

const app = express();
const httpServer = createServer(app);

// Socket.IO setup with CORS
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ============================================================
// Middleware
// ============================================================

app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// API Routes
// ============================================================

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/barter-chains', barterChainRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/community', communityRoutes);

// ============================================================
// Error Handling
// ============================================================

app.use(errorHandler);

// ============================================================
// Socket.IO Handlers
// ============================================================

setupSocketHandlers(io);

// ============================================================
// Start Server
// ============================================================

httpServer.listen(config.port, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║   Nuvra API                     ║
  ║   Running on http://localhost:${config.port}              ║
  ║   Environment: ${config.nodeEnv.padEnd(33)}║
  ╚═══════════════════════════════════════════════════╝
  `);
});

export { app, io };
