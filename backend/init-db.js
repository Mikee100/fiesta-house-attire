const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { Pool } = require('pg');

const useSsl = process.env.DATABASE_SSL !== 'false';
const adminSeedEmail = process.env.ADMIN_SEED_EMAIL || 'admin@fiestahouseattire.com';
const adminSeedPassword = process.env.ADMIN_SEED_PASSWORD || '@Siteadmin2030';
const adminSeedName = process.env.ADMIN_SEED_NAME || 'Fiesta House Admin';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl
    ? {
        rejectUnauthorized: false
      }
    : false
});

const initDb = async () => {
  try {
    console.log("Connecting to database...");

    // Ensure crypto helpers are available for UUIDs and password hashing
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    
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
        is_public BOOLEAN DEFAULT true,
        public_slug TEXT,
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
        is_public BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✓ Assets table created or already exists");

    // Create Videos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS videos (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        video_url TEXT NOT NULL,
        source_type TEXT DEFAULT 'url',
        is_featured BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✓ Videos table created or already exists");

    // Create Users table for admin authentication
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        role TEXT NOT NULL DEFAULT 'admin',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✓ Users table created or already exists");

    // Seed admin user (idempotent)
    await pool.query(`
      INSERT INTO users (email, password_hash, full_name, role, is_active)
      VALUES (
        $1,
        crypt($2, gen_salt('bf')),
        $3,
        'admin',
        true
      )
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = crypt($2, gen_salt('bf')),
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
    `, [
      adminSeedEmail,
      adminSeedPassword,
      adminSeedName
    ]);
    console.log("✓ Admin user seeded");

    // Create refresh token table for persistent admin sessions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_refresh_tokens (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        revoked_at TIMESTAMP WITH TIME ZONE,
        replaced_by_token_hash TEXT,
        user_agent TEXT,
        ip_address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON user_refresh_tokens(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON user_refresh_tokens(expires_at);`);
    console.log("✓ Refresh token table created or already exists");

    console.log("Database initialization complete!");
    process.exit(0);
  } catch (err) {
    console.error("Initialization failed:", err);
    process.exit(1);
  }
};

initDb();
