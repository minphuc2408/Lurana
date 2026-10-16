import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

// Each test owns its in-memory database; fixture mutations cannot touch local D1.
// Count executed statements, including each statement in a batch, not prepares.
export function createTestDb() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec(readFileSync(new URL('../../migrations/0001_mvp.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../../migrations/0002_category_images.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../../docs/sql/MVP_SEED_DEV.sql', import.meta.url), 'utf8'));
  const queries = [];
  const plain = row => row ? { ...row } : null;

  function prepare(sql, values = []) {
    const statement = () => {
      queries.push({ sql, values: [...values] });
      return sqlite.prepare(sql);
    };
    return {
      bind(...bound) { return prepare(sql, bound); },
      async all() {
        return { success: true, results: statement().all(...values).map(plain), meta: {} };
      },
      async first(column) {
        const row = plain(statement().get(...values));
        return column === undefined ? row : row?.[column] ?? null;
      },
      async run() {
        const result = statement().run(...values);
        return { success: true, results: [], meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
      },
    };
  }

  const db = {
    prepare,
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.all());
        sqlite.exec('COMMIT');
        return results;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return {
    db, sqlite, queries,
    get queryCount() { return queries.length; },
    resetQueryCount() { queries.length = 0; },
    exec(sql) { sqlite.exec(sql); },
    close() { sqlite.close(); },
  };
}
