"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const REQUIRED_ENV_VARS = [
    'DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'CLIENT_URL',
];
function validateEnv() {
    const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
    if (missing.length > 0) {
        console.error('❌ CRITICAL STARTUP ERROR: Missing required environment variables:');
        missing.forEach((name) => console.error(`  - ${name}`));
        process.exit(1);
    }
    console.log('✅ Required environment variables verified.');
}
