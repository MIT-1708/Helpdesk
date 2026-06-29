import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prisma.js';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth.js';

// Validate environment variables first
import { validateEnv } from './utils/env-validator.js';
validateEnv();

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Dynamic CORS configuration restricted to trusted origins only
const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean) as string[];
if (allowedOrigins.length === 0) {
  allowedOrigins.push('http://localhost:5173'); // Default fallback for local dev
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: Untrusted origin'));
    }
  },
  credentials: true,
}));

// Better Auth API Route Handler (must be mounted before express.json())
app.all('/api/auth/*', toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Require Admin Middleware
const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized: No active session' });
    }

    if (session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    (req as any).session = session;
    next();
  } catch (error) {
    console.error('Error in requireAdmin middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Current User Session (excluding the session token)
app.get('/api/me', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Strip session token
    const { token, ...sanitizedSession } = session.session;

    res.json({
      user: session.user,
      session: sanitizedSession,
    });
  } catch (error) {
    console.error('Error in /api/me:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Router
const adminRouter = express.Router();
adminRouter.use(requireAdmin);

// Placeholder admin endpoint
adminRouter.get('/users', async (req, res) => {
  res.json({ message: 'Welcome Admin' });
});

app.use('/api/admin', adminRouter);

// Health Check Endpoint (checks DB connectivity)
app.get('/api/health', async (req, res) => {
  try {
    // Attempt simple query to verify database is up
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message || 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Basic Root Endpoint
app.get('/', (req, res) => {
  res.send('AI-Powered Ticket Management System API is running.');
});

app.listen(PORT, () => {
  console.log(`[server] Server running on http://localhost:${PORT}`);
});
