import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, rowToEntity } from '../db.js';
import { authRequired, signToken } from '../middleware/auth.js';
import { newId } from '../utils.js';

const router = Router();

router.post('/register', (req, res) => {
  const { email, password, full_name, phone_number } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }
  const id = newId();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, phone_number, role, kyc_status, account_status)
    VALUES (?, ?, ?, ?, ?, 'user', 'not_submitted', 'active')
  `).run(id, email.toLowerCase(), hash, full_name || '', phone_number || null);

  const user = rowToEntity(db.prepare('SELECT * FROM users WHERE id = ?').get(id));
  const token = signToken(user);
  res.status(201).json({ token, user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const user = rowToEntity(row);
  const token = signToken(user);
  res.json({ token, user });
});

router.get('/me', authRequired, (req, res) => {
  res.json(req.user);
});

router.patch('/me', authRequired, (req, res) => {
  const allowed = ['full_name', 'phone_number', 'avatar_url', 'kyc_status'];
  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  }
  if (!updates.length) {
    return res.json(req.user);
  }
  values.push(req.user.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const user = rowToEntity(db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id));
  res.json(user);
});

export default router;
