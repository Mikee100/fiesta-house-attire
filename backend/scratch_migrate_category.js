require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const migrate = async () => {
  try {
    await pool.query('ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS category TEXT;');
    console.log("✓ Added category column to portfolios");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

migrate();
