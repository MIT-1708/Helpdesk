"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const prisma_js_1 = __importDefault(require("./prisma.js"));
const node_1 = require("better-auth/node");
const auth_js_1 = require("./auth.js");
// Validate environment variables first
const env_validator_js_1 = require("./utils/env-validator.js");
(0, env_validator_js_1.validateEnv)();
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), envFile) });
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Dynamic CORS configuration restricted to trusted origins only
const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean);
if (allowedOrigins.length === 0) {
    allowedOrigins.push('http://localhost:5173'); // Default fallback for local dev
}
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS: Untrusted origin'));
        }
    },
    credentials: true,
}));
// Better Auth API Route Handler (must be mounted before express.json())
app.all('/api/auth/*', (0, node_1.toNodeHandler)(auth_js_1.auth));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Require Admin Middleware
const requireAdmin = async (req, res, next) => {
    try {
        const session = await auth_js_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
        });
        if (!session) {
            return res.status(401).json({ error: 'Unauthorized: No active session' });
        }
        if (session.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        req.session = session;
        next();
    }
    catch (error) {
        console.error('Error in requireAdmin middleware:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// Get Current User Session (excluding the session token)
app.get('/api/me', async (req, res) => {
    try {
        const session = await auth_js_1.auth.api.getSession({
            headers: (0, node_1.fromNodeHeaders)(req.headers),
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
    }
    catch (error) {
        console.error('Error in /api/me:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Admin Router
const adminRouter = express_1.default.Router();
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
        await prisma_js_1.default.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
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
