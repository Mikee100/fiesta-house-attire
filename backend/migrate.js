require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrate() {
  try {
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

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
