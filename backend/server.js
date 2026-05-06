require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase/hosted DBs
  }
});

// Supabase Storage Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Routes

// Get all portfolios with their images
app.get('/api/portfolios', async (req, res) => {
  try {
    const portfoliosResult = await pool.query('SELECT * FROM portfolios ORDER BY "order" ASC');
    const imagesResult = await pool.query('SELECT * FROM portfolio_images ORDER BY "order" ASC');

    const portfolios = portfoliosResult.rows.map(p => ({
      ...p,
      images: imagesResult.rows.filter(img => img.portfolio_id === p.id)
    }));

    res.json(portfolios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create a new portfolio
app.post('/api/portfolios', async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const slug = title.toLowerCase().replace(/ /g, '-');
  
  try {
    const result = await pool.query(
      'INSERT INTO portfolios (title, slug) VALUES ($1, $2) RETURNING *',
      [title, slug]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create portfolio' });
  }
});

// Add image to portfolio
app.post('/api/portfolios/:id/images', async (req, res) => {
  const { id } = req.params;
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const result = await pool.query(
      'INSERT INTO portfolio_images (portfolio_id, url) VALUES ($1, $2) RETURNING *',
      [id, url]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add image' });
  }
});

// Bulk add images to portfolio
app.post('/api/portfolios/:id/images/bulk', async (req, res) => {
  const { id } = req.params;
  const { urls } = req.body;
  if (!urls || !Array.isArray(urls)) return res.status(400).json({ error: 'URLs array is required' });

  try {
    const results = [];
    for (const url of urls) {
      const result = await pool.query(
        'INSERT INTO portfolio_images (portfolio_id, url) VALUES ($1, $2) RETURNING *',
        [id, url]
      );
      results.push(result.rows[0]);
    }
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add images' });
  }
});

// Delete portfolio
app.delete('/api/portfolios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM portfolios WHERE id = $1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Delete image
app.delete('/api/portfolio-images/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM portfolio_images WHERE id = $1', [id]);
    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// --- Media Library (Folders & Assets) ---

// Get all folders
app.get('/api/folders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM folders ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Create folder
app.post('/api/folders', async (req, res) => {
  const { name, parent_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO folders (name, parent_id) VALUES ($1, $2) RETURNING *',
      [name, parent_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Update folder (e.g., set cover image)
app.patch('/api/folders/:id', async (req, res) => {
  const { id } = req.params;
  const { cover_image_url, name } = req.body;
  
  try {
    let query = 'UPDATE folders SET ';
    const params = [];
    let count = 1;

    if (cover_image_url !== undefined) {
      query += `cover_image_url = $${count}, `;
      params.push(cover_image_url);
      count++;
    }
    if (name !== undefined) {
      query += `name = $${count}, `;
      params.push(name);
      count++;
    }

    // Remove trailing comma and space
    query = query.slice(0, -2);
    query += ` WHERE id = $${count} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// Get assets (optionally filtered by folder) with pagination
app.get('/api/assets', async (req, res) => {
  const { folder_id, page = 1, limit = 20, search } = req.query;
  const offset = (page - 1) * limit;

  try {
    let whereClause = '';
    let params = [];
    
    if (folder_id && search) {
      whereClause = ' WHERE folder_id = $1 AND url ILIKE $2';
      params.push(folder_id, `%${search}%`);
    } else if (folder_id) {
      whereClause = ' WHERE folder_id = $1';
      params.push(folder_id);
    } else if (search) {
      whereClause = ' WHERE url ILIKE $1';
      params.push(`%${search}%`);
    }

    // Get total count
    const countResult = await pool.query(`SELECT COUNT(*) FROM assets${whereClause}`, params);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get paginated assets
    const assetsQuery = `
      SELECT * FROM assets 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const assetsParams = [...params, limit, offset];
    
    const assetsResult = await pool.query(assetsQuery, assetsParams);

    res.json({
      assets: assetsResult.rows,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// Bulk add assets by URL (existing)
app.post('/api/assets/bulk', async (req, res) => {
  const { urls, folder_id } = req.body;
  if (!urls || !Array.isArray(urls)) return res.status(400).json({ error: 'URLs array is required' });

  try {
    const results = [];
    for (const url of urls) {
      const res = await pool.query(
        'INSERT INTO assets (url, folder_id) VALUES ($1, $2) RETURNING *',
        [url, folder_id]
      );
      results.push(res.rows[0]);
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add assets' });
  }
});

// Single file upload to storage
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const fileName = `${Date.now()}_${req.file.originalname}`;
    const { data, error } = await supabase.storage
      .from('assets') // Bucket name must be 'assets'
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('assets')
      .getPublicUrl(fileName);

    res.json({ url: publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload to Supabase failed' });
  }
});

// Create asset after upload (Convenience endpoint)
app.post('/api/assets', async (req, res) => {
  const { url, folder_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO assets (url, folder_id) VALUES ($1, $2) RETURNING *',
      [url, folder_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save asset' });
  }
});

// Delete asset
app.delete('/api/assets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM assets WHERE id = $1', [id]);
    res.json({ message: 'Asset deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ─── Blog API ────────────────────────────────────────────────────────────────

// GET /api/blog-categories — all categories
app.get('/api/blog-categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM blog_categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/blog-categories — create category
app.post('/api/blog-categories', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  try {
    const result = await pool.query(
      'INSERT INTO blog_categories (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET name=$1 RETURNING *',
      [name, slug]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// GET /api/blog-posts — published posts (paginated, optional ?category=slug)
app.get('/api/blog-posts', async (req, res) => {
  const { page = 1, limit = 9, category } = req.query;
  const offset = (page - 1) * limit;
  try {
    let baseQuery = `
      SELECT p.*, 
        COALESCE(
          json_agg(json_build_object('id', c.id, 'name', c.name, 'slug', c.slug))
          FILTER (WHERE c.id IS NOT NULL), '[]'
        ) AS categories
      FROM blog_posts p
      LEFT JOIN blog_post_categories pc ON pc.post_id = p.id
      LEFT JOIN blog_categories c ON c.id = pc.category_id
      WHERE p.status = 'published'
    `;
    const params = [];
    if (category) {
      params.push(category);
      baseQuery += ` AND EXISTS (
        SELECT 1 FROM blog_post_categories pc2
        JOIN blog_categories c2 ON c2.id = pc2.category_id
        WHERE pc2.post_id = p.id AND c2.slug = $${params.length}
      )`;
    }
    baseQuery += ' GROUP BY p.id ORDER BY p.published_at DESC';

    const countResult = await pool.query(
      `SELECT COUNT(p.id) FROM blog_posts p
       WHERE p.status = 'published'${category ? ` AND EXISTS (
         SELECT 1 FROM blog_post_categories pc2
         JOIN blog_categories c2 ON c2.id = pc2.category_id
         WHERE pc2.post_id = p.id AND c2.slug = $1
       )` : ''}`,
      category ? [category] : []
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await pool.query(
      `${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      posts: result.rows,
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/blog-posts/all — ALL posts including drafts (admin)
app.get('/api/blog-posts/all', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
        COALESCE(
          json_agg(json_build_object('id', c.id, 'name', c.name, 'slug', c.slug))
          FILTER (WHERE c.id IS NOT NULL), '[]'
        ) AS categories
      FROM blog_posts p
      LEFT JOIN blog_post_categories pc ON pc.post_id = p.id
      LEFT JOIN blog_categories c ON c.id = pc.category_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/blog-posts/:slug — single post by slug
app.get('/api/blog-posts/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const result = await pool.query(`
      SELECT p.*,
        COALESCE(
          json_agg(json_build_object('id', c.id, 'name', c.name, 'slug', c.slug))
          FILTER (WHERE c.id IS NOT NULL), '[]'
        ) AS categories
      FROM blog_posts p
      LEFT JOIN blog_post_categories pc ON pc.post_id = p.id
      LEFT JOIN blog_categories c ON c.id = pc.category_id
      WHERE p.slug = $1
      GROUP BY p.id
    `, [slug]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /api/blog-posts — create post
app.post('/api/blog-posts', async (req, res) => {
  const { title, slug, excerpt, content, cover_image_url, author, status, published_at, category_ids } = req.body;
  if (!title || !slug) return res.status(400).json({ error: 'Title and slug are required' });
  try {
    const result = await pool.query(
      `INSERT INTO blog_posts (title, slug, excerpt, content, cover_image_url, author, status, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, slug, excerpt, content, cover_image_url, author || 'admin', status || 'draft',
       status === 'published' ? (published_at || new Date().toISOString()) : published_at]
    );
    const post = result.rows[0];

    if (category_ids && category_ids.length > 0) {
      for (const cid of category_ids) {
        await pool.query(
          'INSERT INTO blog_post_categories (post_id, category_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [post.id, cid]
        );
      }
    }
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// PUT /api/blog-posts/:id — update post
app.put('/api/blog-posts/:id', async (req, res) => {
  const { id } = req.params;
  const { title, slug, excerpt, content, cover_image_url, author, status, published_at, category_ids } = req.body;
  try {
    const result = await pool.query(
      `UPDATE blog_posts SET
         title=$1, slug=$2, excerpt=$3, content=$4, cover_image_url=$5,
         author=$6, status=$7, published_at=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [title, slug, excerpt, content, cover_image_url, author, status,
       status === 'published' ? (published_at || new Date().toISOString()) : published_at, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' });
    const post = result.rows[0];

    // Replace categories
    await pool.query('DELETE FROM blog_post_categories WHERE post_id = $1', [id]);
    if (category_ids && category_ids.length > 0) {
      for (const cid of category_ids) {
        await pool.query(
          'INSERT INTO blog_post_categories (post_id, category_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
          [id, cid]
        );
      }
    }
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// DELETE /api/blog-posts/:id
app.delete('/api/blog-posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM blog_posts WHERE id = $1', [id]);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// GET /api/blog-posts-recent — last 3 published (for sidebar)
app.get('/api/blog-posts-recent', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, slug, cover_image_url, published_at FROM blog_posts
       WHERE status='published' ORDER BY published_at DESC LIMIT 5`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent posts' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
