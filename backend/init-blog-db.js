require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const CATEGORIES = [
  'Appointment', 'Baby Care', 'Breast Feeding', 'Business',
  'Labor', 'Maternity Photo Shoots', 'Motherhood', 'Postpartum',
  'Pregnancy', 'Pregnancy Struggles', 'Self-Care', 'Siblings',
  'Tips', 'Working Mom'
];

const toSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const initBlogDb = async () => {
  try {
    console.log('Connecting to database...');

    // Blog Categories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_categories (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✓ blog_categories table ready');

    // Blog Posts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        excerpt TEXT,
        content TEXT,
        cover_image_url TEXT,
        author TEXT DEFAULT 'admin',
        status TEXT DEFAULT 'draft',
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✓ blog_posts table ready');

    // Junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_post_categories (
        post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
        category_id UUID REFERENCES blog_categories(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, category_id)
      );
    `);
    console.log('✓ blog_post_categories table ready');

    // Seed categories (skip if already exist)
    for (const name of CATEGORIES) {
      const slug = toSlug(name);
      await pool.query(
        `INSERT INTO blog_categories (name, slug) VALUES ($1, $2)
         ON CONFLICT (slug) DO NOTHING`,
        [name, slug]
      );
    }
    console.log(`✓ Seeded ${CATEGORIES.length} categories`);

    console.log('\nBlog database initialization complete!');
    process.exit(0);
  } catch (err) {
    console.error('Initialization failed:', err);
    process.exit(1);
  }
};

initBlogDb();
