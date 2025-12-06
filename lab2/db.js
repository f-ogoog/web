const { Pool } = require('pg');
require('dotenv').config();

async function initDatabaseAndGetClient() {
  console.log(process.env.DB_HOST, process.env.DB_PORT, process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_NAME);
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  pool.on('error', (err) => {
    console.error('Помилка PostgreSQL:', err);
  });

  try {
    // Створення таблиці користувачів
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);
  } catch (error) {
    console.error('Помилка ініціалізації БД:', error);
    throw error;
  }

  return pool;
}

module.exports = initDatabaseAndGetClient;
