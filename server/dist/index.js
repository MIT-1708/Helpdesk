"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_js_1 = __importDefault(require("./prisma.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
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
