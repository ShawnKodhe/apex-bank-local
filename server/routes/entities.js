import { Router } from 'express';
import { db, rowToEntity } from '../db.js';
import { authRequired, adminRequired } from '../middleware/auth.js';
import { newId, buildFilterQuery } from '../utils.js';

const router = Router();
router.use(authRequired);

router.get('/users/lookup', (req, res) => {
  const email = req.query.email?.toLowerCase();
  if (!email) return res.status(400).json({ message: 'Email required' });

  const user = db.prepare('SELECT id, email, full_name, kyc_status FROM users WHERE email = ?').get(email);
  if (!user) return res.json({ found: false });
  res.json({ found: true, user: rowToEntity(user) });
});

const TABLES = {
  Wallet: 'wallets',
  Transaction: 'transactions',
  KYCRequest: 'kyc_requests',
  User: 'users',
};

function canAccessWallet(user, wallet) {
  return wallet.user_email === user.email || user.role === 'admin';
}

function canAccessTransaction(user, txn) {
  return txn.user_email === user.email || user.role === 'admin';
}

function canAccessKyc(user, kyc) {
  return kyc.user_email === user.email || user.role === 'admin';
}

// POST /api/entities/:name/filter
router.post('/:entity/filter', (req, res) => {
  const table = TABLES[req.params.entity];
  if (!table) return res.status(404).json({ message: 'Unknown entity' });

  const { filters = {}, sort, limit = 100 } = req.body;
  const { user } = req;

  if (req.params.entity === 'User' && user.role !== 'admin') {
    const email = filters.email;
    if (email && email !== user.email) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (!email) filters.email = user.email;
  }

  if (req.params.entity === 'Wallet' && user.role !== 'admin' && !filters.user_email) {
    filters.user_email = user.email;
  }
  if (req.params.entity === 'Transaction' && user.role !== 'admin' && !filters.user_email) {
    filters.user_email = user.email;
  }
  if (req.params.entity === 'KYCRequest' && user.role !== 'admin' && !filters.user_email) {
    filters.user_email = user.email;
  }

  const { sql, params } = buildFilterQuery(table, filters, sort, limit);
  const rows = db.prepare(sql).all(...params);

  if (req.params.entity === 'User') {
    return res.json(rows.map(rowToEntity));
  }
  res.json(rows);
});

// GET /api/entities/:name/list
router.get('/:entity/list', (req, res) => {
  const table = TABLES[req.params.entity];
  if (!table) return res.status(404).json({ message: 'Unknown entity' });

  if (req.params.entity === 'User' || req.params.entity === 'KYCRequest') {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
  }

  const sort = req.query.sort || '-created_date';
  const limit = parseInt(req.query.limit || '100', 10);
  const { sql, params } = buildFilterQuery(table, {}, sort, limit);
  const rows = db.prepare(sql).all(...params);

  if (req.params.entity === 'User') {
    return res.json(rows.map(rowToEntity));
  }
  res.json(rows);
});

// POST /api/entities/:name
router.post('/:entity', (req, res) => {
  const entity = req.params.entity;
  const table = TABLES[entity];
  if (!table) return res.status(404).json({ message: 'Unknown entity' });

  const id = newId();
  const data = { ...req.body, id };
  const { user } = req;

  if (entity === 'Wallet') {
    data.user_email = user.email;
  }
  if (entity === 'Transaction' || entity === 'KYCRequest') {
    if (!data.user_email) data.user_email = user.email;
  }
  if (entity === 'KYCRequest' && data.user_email !== user.email && user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (
    entity === 'Transaction' &&
    data.user_email !== user.email &&
    user.role !== 'admin' &&
    data.type !== 'transfer_in'
  ) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const columns = Object.keys(data);
  const placeholders = columns.map(() => '?').join(', ');
  db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`).run(
    ...columns.map((c) => data[c])
  );

  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  res.status(201).json(row);

  if (entity === 'Transaction') {
    req.app.locals.broadcastTransaction?.(row);
  }
});

// PATCH /api/entities/:name/:id
router.patch('/:entity/:id', (req, res) => {
  const entity = req.params.entity;
  const table = TABLES[entity];
  if (!table) return res.status(404).json({ message: 'Unknown entity' });

  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ message: 'Not found' });

  const { user } = req;
  if (entity === 'Wallet' && user.role !== 'admin' && row.user_email !== user.email) {
    const keys = Object.keys(req.body);
    if (!keys.every((k) => k === 'balance')) {
      return res.status(403).json({ message: 'Forbidden' });
    }
  }
  if (entity === 'Transaction' && !canAccessTransaction(user, row)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (entity === 'KYCRequest' && !canAccessKyc(user, row) && user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (entity === 'User' && user.role !== 'admin' && row.id !== user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const updates = [];
  const values = [];
  for (const [key, value] of Object.entries(req.body)) {
    if (key === 'id' || key === 'password_hash') continue;
    updates.push(`${key} = ?`);
    values.push(value);
  }
  if (!updates.length) return res.json(entity === 'User' ? rowToEntity(row) : row);

  values.push(req.params.id);
  db.prepare(`UPDATE ${table} SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  const updated = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);

  if (entity === 'Transaction') {
    req.app.locals.broadcastTransaction?.(updated);
  }

  res.json(entity === 'User' ? rowToEntity(updated) : updated);
});

// DELETE /api/entities/:name/:id
router.delete('/:entity/:id', (req, res) => {
  const entity = req.params.entity;
  const table = TABLES[entity];
  if (!table) return res.status(404).json({ message: 'Unknown entity' });

  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ message: 'Not found' });

  const { user } = req;
  if (entity === 'Wallet' && !canAccessWallet(user, row)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  if (entity === 'User') {
    return res.status(403).json({ message: 'Cannot delete users' });
  }

  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
  res.status(204).send();
});

export default router;
