import mysql from 'mysql2/promise';
import './env.js';

const requiredDbEnv = ['DB_USER', 'DB_NAME'];
const missingDbEnv = requiredDbEnv.filter((key) => !process.env[key]);

if (missingDbEnv.length) {
  throw new Error(`Missing database config in server/.env: ${missingDbEnv.join(', ')}`);
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS || process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

export async function q(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}
