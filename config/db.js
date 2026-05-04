const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Ayan@2023',
    database: process.env.DB_NAME || 'jp_multiservices',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 10000
  });
}

/**
 * Initialize the database connection with retry logic.
 * Retries up to maxRetries times with a delay between attempts.
 * This handles the case where MySQL service hasn't started yet.
 */
async function initializeDB(maxRetries = 5, retryDelay = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      pool = createPool();
      const conn = await pool.getConnection();
      console.log('✅ MySQL connected successfully');
      conn.release();
      return pool;
    } catch (err) {
      console.error(`❌ MySQL connection attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      
      if (pool) {
        try { await pool.end(); } catch (_) {}
        pool = null;
      }

      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.error('\n══════════════════════════════════════════════════');
        console.error('💀 Could not connect to MySQL after all retries!');
        console.error('');
        console.error('   Please make sure MySQL is running:');
        console.error('   1. Open Services (Win+R → services.msc)');
        console.error('   2. Find "MySQL80" or "MySQL" service');
        console.error('   3. Right-click → Start');
        console.error('');
        console.error('   Or start it from CMD (as Admin):');
        console.error('   > net start MySQL80');
        console.error('══════════════════════════════════════════════════\n');
        process.exit(1);
      }
    }
  }
}

/**
 * Get the active pool. Throws if not initialized.
 */
function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDB() first.');
  }
  return pool;
}

module.exports = { initializeDB, getPool };
