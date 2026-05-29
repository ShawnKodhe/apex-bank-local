import { v4 as uuidv4 } from 'uuid';

export function newId() {
  return uuidv4();
}

export function parseSort(sort) {
  if (!sort) return { column: 'created_date', dir: 'DESC' };
  const desc = sort.startsWith('-');
  const column = desc ? sort.slice(1) : sort;
  const allowed = ['created_date', 'amount', 'status'];
  const col = allowed.includes(column) ? column : 'created_date';
  return { column: col, dir: desc ? 'DESC' : 'ASC' };
}

export function buildFilterQuery(table, filters, sort, limit) {
  const { column, dir } = parseSort(sort);
  const clauses = [];
  const params = [];

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      clauses.push(`${key} = ?`);
      params.push(value);
    }
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `SELECT * FROM ${table} ${where} ORDER BY ${column} ${dir} LIMIT ?`;
  params.push(limit || 100);
  return { sql, params };
}
