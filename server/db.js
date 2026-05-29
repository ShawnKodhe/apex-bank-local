import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'apex-bank.db');
export const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    kyc_status TEXT DEFAULT 'not_submitted',
    account_status TEXT DEFAULT 'active',
    total_balance REAL DEFAULT 0,
    phone_number TEXT,
    avatar_url TEXT,
    created_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    wallet_type TEXT NOT NULL,
    wallet_name TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    balance REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'active',
    created_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    wallet_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending',
    description TEXT,
    recipient TEXT,
    reference_id TEXT,
    fee REAL DEFAULT 0,
    created_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS kyc_requests (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    nationality TEXT,
    id_type TEXT NOT NULL,
    id_number TEXT NOT NULL,
    id_document_url TEXT,
    selfie_url TEXT,
    address TEXT,
    phone_number TEXT,
    status TEXT DEFAULT 'pending',
    review_notes TEXT,
    reviewed_by TEXT,
    created_date TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_email);
  CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_email);
  CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_requests(user_email);
`);

const adminEmail = process.env.ADMIN_EMAIL || 'admin@apexbank.local';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

if (!existingAdmin) {
  const hash = bcrypt.hashSync(adminPassword, 10);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role, kyc_status, account_status)
    VALUES (?, ?, ?, ?, 'admin', 'approved', 'active')
  `).run(uuidv4(), adminEmail, hash, 'Admin User');
  console.log(`Default admin created: ${adminEmail} / ${adminPassword}`);
}

export function rowToEntity(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}
