import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prisma.js';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Better Auth API Route Handler (must be mounted before express.json())
app.all('/api/auth/*', toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
