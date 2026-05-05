require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const initDb = async () => {
  try {
    console.log("Connecting to database...");
    
    // Create Portfolios table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS portfolios (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        "order" INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✓ Portfolios table created or already exists");

    // Create Portfolio Images table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS portfolio_images (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        "order" INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✓ Portfolio Images table created or already exists");

    // Create Folders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS folders (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✓ Folders table created or already exists");

    // Create Assets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        url TEXT NOT NULL,
        folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✓ Assets table created or already exists");

    console.log("Database initialization complete!");
    process.exit(0);
  } catch (err) {
    console.error("Initialization failed:", err);
    process.exit(1);
  }
};

initDb();
