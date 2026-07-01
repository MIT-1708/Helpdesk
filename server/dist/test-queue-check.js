"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
const prisma = new client_1.PrismaClient();
async function run() {
    try {
        // Let's query pg-boss tables directly using raw queries!
        const schemas = await prisma.$queryRawUnsafe(`
      SELECT schema_name FROM information_schema.schemata;
    `);
        console.log('Available schemas:', schemas);
        const tables = await prisma.$queryRawUnsafe(`
      SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%boss%' OR table_schema LIKE '%boss%';
    `);
        console.log('PgBoss tables:', tables);
        // Let's query the jobs table if it exists
        const jobs = await prisma.$queryRawUnsafe(`
      SELECT * FROM pgboss.job WHERE id = 'fdea6a13-510e-4942-9122-28b2ee8b6366';
    `);
        console.log('Latest pgboss jobs:', JSON.stringify(jobs, null, 2));
    }
    catch (error) {
        console.error('Error querying pgboss tables:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
run();
