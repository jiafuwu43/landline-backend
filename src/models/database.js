const { Pool } = require('pg');

class Database {
  constructor() {
    this.pool = null;
  }

  connect() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'landline',
      user: process.env.DB_USER || process.env.USER || 'postgres',
      password: process.env.DB_PASSWORD || undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    return this.pool.query('SELECT NOW()')
      .then(() => {})
      .catch((err) => {
        throw err;
      });
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  async all(sql, params = []) {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  async get(sql, params = []) {
    const result = await this.pool.query(sql, params);
    return result.rows[0] || null;
  }

  async run(sql, params = []) {
    const result = await this.pool.query(sql, params);
    const lastID = result.rows[0]?.id || null;
    return {
      lastID: lastID,
      changes: result.rowCount,
    };
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const txDb = {
        all: (sql, params) => {
          return client.query(sql, params).then(result => result.rows);
        },
        get: (sql, params) => {
          return client.query(sql, params).then(result => result.rows[0] || null);
        },
        run: (sql, params) => {
          return client.query(sql, params).then(result => ({
            lastID: result.rows[0]?.id || null,
            changes: result.rowCount,
          }));
        },
      };

      const result = await callback(txDb);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

const db = new Database();

module.exports = db;