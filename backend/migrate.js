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

async function migrate() {
  try {
    // 0. Ensure pgcrypto extension exists for password hashing
    await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    console.log('✓ Ensured pgcrypto extension exists');

    // 1. Add cover_image_url to folders (existing)
    await pool.query('ALTER TABLE folders ADD COLUMN IF NOT EXISTS cover_image_url TEXT');
    console.log('✓ Successfully ensured cover_image_url exists on folders');

    // 2. Deduplicate portfolio_images
    console.log('Deduplicating portfolio_images...');
    await pool.query(`
      DELETE FROM portfolio_images 
      WHERE id IN (
          SELECT id 
          FROM (
              SELECT id, 
              ROW_NUMBER() OVER (PARTITION BY portfolio_id, url ORDER BY created_at ASC) as row_num 
              FROM portfolio_images
          ) t 
          WHERE t.row_num > 1
      )
    `);
    console.log('✓ Successfully deduplicated portfolio_images');

    // 3. Add UNIQUE constraint to portfolio_images
    console.log('Adding UNIQUE constraint to portfolio_images...');
    // We check if it exists first to avoid error on second run
    const constraintCheck = await pool.query(`
      SELECT 1 FROM pg_constraint WHERE conname = 'unique_portfolio_image'
    `);
    
    if (constraintCheck.rows.length === 0) {
      await pool.query(`
        ALTER TABLE portfolio_images 
        ADD CONSTRAINT unique_portfolio_image UNIQUE (portfolio_id, url)
      `);
      console.log('✓ Successfully added UNIQUE constraint unique_portfolio_image');
    } else {
      console.log('- UNIQUE constraint unique_portfolio_image already exists');
    }

    // 4. Ensure videos table exists
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
      )
    `);
    console.log('✓ Ensured videos table exists');

    // 5. Ensure users table exists
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
      )
    `);
    console.log('✓ Ensured users table exists');

    // 6. Seed admin user (idempotent)
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES ($1, crypt($2, gen_salt('bf')), $3, 'admin', true)
       ON CONFLICT (email)
       DO UPDATE SET
         password_hash = crypt($2, gen_salt('bf')),
         full_name = EXCLUDED.full_name,
         role = EXCLUDED.role,
         is_active = EXCLUDED.is_active,
         updated_at = NOW()`,
      [adminSeedEmail, adminSeedPassword, adminSeedName]
    );
    console.log('✓ Admin user seeded');

    // 7. Ensure refresh token table exists
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
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON user_refresh_tokens(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON user_refresh_tokens(expires_at)');
    console.log('✓ Ensured user_refresh_tokens table exists');

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
