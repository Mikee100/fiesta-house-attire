require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

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

// Initialize Shop Database
const initShopDb = async () => {
  try {
    console.log("Checking shop database tables...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shop_packages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        description TEXT,
        duration TEXT,
        images_count TEXT,
        outfits_count TEXT,
        color TEXT,
        popular BOOLEAN DEFAULT false,
        features JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shop_orders (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        total_amount INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_status TEXT DEFAULT 'unpaid',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS shop_order_items (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        order_id UUID REFERENCES shop_orders(id) ON DELETE CASCADE,
        package_id UUID REFERENCES shop_packages(id) ON DELETE SET NULL,
        package_name TEXT NOT NULL,
        price INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Seed initial packages if none exist
    const checkPkgs = await pool.query('SELECT COUNT(*) FROM shop_packages');
    if (parseInt(checkPkgs.rows[0].count) === 0) {
      console.log("Seeding initial shop packages...");
      const initialPackages = [
        { name: "Standard Package", price: 10000, color: "#6EC1E4", features: ["6 edited images", "2 gowns"] },
        { name: "Economy Package", price: 15000, color: "#B84FA0", features: ["12 edited images", "3 gowns"] },
        { name: "Executive Package", price: 20000, color: "#6EC1E4", features: ["15 edited images", "4 gowns"] },
        { name: "Gold Package", price: 30000, color: "#B84FA0", features: ["20 edited images", "Photobook"], popular: true }
      ];
      for (const p of initialPackages) {
        await pool.query(
          `INSERT INTO shop_packages (name, price, color, features, popular) VALUES ($1, $2, $3, $4, $5)`,
          [p.name, p.price, p.color, JSON.stringify(p.features), p.popular || false]
        );
      }
    }
    console.log("✓ Shop database initialized");
  } catch (err) {
    console.error("Shop DB Init Error:", err);
  }
};

initShopDb();

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
      'INSERT INTO portfolio_images (portfolio_id, url) VALUES ($1, $2) ON CONFLICT (portfolio_id, url) DO NOTHING RETURNING *',
      [id, url]
    );
    res.json(result.rows[0] || { message: 'Image already exists' });
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
        'INSERT INTO portfolio_images (portfolio_id, url) VALUES ($1, $2) ON CONFLICT (portfolio_id, url) DO NOTHING RETURNING *',
        [id, url]
      );
      if (result.rows[0]) {
        results.push(result.rows[0]);
      }
    }
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add images' });
  }
});

// Deduplicate portfolio images
app.post('/api/portfolios/:id/deduplicate', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      DELETE FROM portfolio_images 
      WHERE portfolio_id = $1 AND id IN (
          SELECT id 
          FROM (
              SELECT id, 
              ROW_NUMBER() OVER (PARTITION BY portfolio_id, url ORDER BY created_at ASC) as row_num 
              FROM portfolio_images
              WHERE portfolio_id = $1
          ) t 
          WHERE t.row_num > 1
      )
    `, [id]);
    res.json({ message: 'Deduplicated successfully', removedCount: result.rowCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Deduplication failed' });
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

// Update portfolio (e.g., set cover image)
app.patch('/api/portfolios/:id', async (req, res) => {
  const { id } = req.params;
  const { cover_image_url, title } = req.body;
  
  try {
    let query = 'UPDATE portfolios SET ';
    const params = [];
    let count = 1;

    if (cover_image_url !== undefined) {
      query += `cover_image_url = $${count}, `;
      params.push(cover_image_url);
      count++;
    }
    if (title !== undefined) {
      query += `title = $${count}, `;
      params.push(title);
      count++;
    }

    if (params.length === 0) return res.status(400).json({ error: 'No fields to update' });

    // Remove trailing comma and space
    query = query.slice(0, -2);
    query += ` WHERE id = $${count} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update portfolio' });
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

// ─── Shop API ────────────────────────────────────────────────────────────────

// GET /api/shop/packages — all active packages
app.get('/api/shop/packages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shop_packages WHERE is_active = true ORDER BY price ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch shop packages' });
  }
});

// POST /api/shop/orders — create new order and send emails
app.post('/api/shop/orders', async (req, res) => {
  const { customer_name, customer_email, customer_phone, items, total_amount } = req.body;
  
  if (!customer_name || !customer_email || !customer_phone || !items || items.length === 0) {
    return res.status(400).json({ error: 'Missing required order details' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create order
    const orderResult = await client.query(
      `INSERT INTO shop_orders (customer_name, customer_email, customer_phone, total_amount) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [customer_name, customer_email, customer_phone, total_amount]
    );
    const order = orderResult.rows[0];

    // Create order items
    for (const item of items) {
      await client.query(
        `INSERT INTO shop_order_items (order_id, package_id, package_name, price, quantity) 
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.id, item.name, item.price, item.quantity]
      );
    }

    await client.query('COMMIT');

    // Send Email Notifications (Fire and forget, don't block response)
    sendOrderEmails(order, items).catch(err => console.error('Email error:', err));

    res.json({ success: true, orderId: order.id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// Helper function for sending emails
async function sendOrderEmails(order, items) {
  // Check if credentials exist to avoid crashes
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Skipping email notification: SMTP credentials missing in .env');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const itemsListHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px 0; font-family: 'Open Sans', sans-serif; color: #333;">${item.name}</td>
      <td style="padding: 12px 0; text-align: center; font-family: 'Open Sans', sans-serif; color: #333;">${item.quantity}</td>
      <td style="padding: 12px 0; text-align: right; font-family: 'Open Sans', sans-serif; color: #333; font-weight: 600;">Ksh ${item.price.toLocaleString()}</td>
    </tr>
  `).join('');

  const brandColors = {
    skyBlue: '#6EC1E4',
    magenta: '#B84FA0',
    cream: '#F9F5F2',
    dark: '#1C1C1C'
  };

  const emailStyles = `
    font-family: 'Open Sans', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    margin: 0 auto;
    background-color: ${brandColors.cream};
    padding: 20px;
  `;

  const commonHeader = `
    <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, ${brandColors.skyBlue} 0%, ${brandColors.magenta} 100%); border-radius: 12px 12px 0 0;">
      <h1 style="color: white; margin: 0; font-family: serif; font-style: italic; font-size: 28px; letter-spacing: 1px;">Fiesta House Attire</h1>
    </div>
  `;

  const adminEmailContent = `
    <div style="${emailStyles}">
      ${commonHeader}
      <div style="background-color: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <h2 style="color: ${brandColors.dark}; border-bottom: 2px solid ${brandColors.skyBlue}; padding-bottom: 10px;">New Order Received!</h2>
        <p style="margin-bottom: 25px;">You have a new package order from the website shop. Here are the details:</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <p style="margin: 5px 0;"><strong>Customer:</strong> ${order.customer_name}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${order.customer_email}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.customer_phone}</p>
          <p style="margin: 5px 0;"><strong>Order ID:</strong> <span style="font-family: monospace; color: ${brandColors.magenta};">${order.id}</span></p>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid ${brandColors.skyBlue};">
              <th style="text-align: left; padding: 10px 0;">Package</th>
              <th style="text-align: center; padding: 10px 0;">Qty</th>
              <th style="text-align: right; padding: 10px 0;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsListHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 20px 0 10px; text-align: right; font-weight: bold; font-size: 18px;">Total Amount:</td>
              <td style="padding: 20px 0 10px; text-align: right; font-weight: bold; font-size: 20px; color: ${brandColors.magenta};">Ksh ${order.total_amount.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
        
        <div style="margin-top: 40px; text-align: center;">
          <a href="tel:${order.customer_phone}" style="background-color: ${brandColors.skyBlue}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 100px; font-weight: bold; display: inline-block;">Call Customer Now</a>
        </div>
      </div>
    </div>
  `;

  const customerEmailContent = `
    <div style="${emailStyles}">
      ${commonHeader}
      <div style="background-color: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <h2 style="color: ${brandColors.dark}; text-align: center; font-family: serif;">Thank you for choosing Fiesta House, ${order.customer_name}!</h2>
        <p style="text-align: center; color: #666; margin-bottom: 30px;">We've received your order and we're excited to be part of your journey.</p>
        
        <h3 style="color: ${brandColors.dark}; border-bottom: 1px solid #eee; padding-bottom: 10px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tbody>
            ${itemsListHtml}
            <tr>
              <td colspan="2" style="padding: 20px 0 10px; text-align: right; font-weight: bold; font-size: 16px;">Total:</td>
              <td style="padding: 20px 0 10px; text-align: right; font-weight: bold; font-size: 18px; color: ${brandColors.magenta};">Ksh ${order.total_amount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div style="background-color: ${brandColors.cream}; padding: 25px; border-radius: 12px; border-left: 4px solid ${brandColors.skyBlue};">
          <h4 style="margin: 0 0 10px 0; color: ${brandColors.dark};">What's Next?</h4>
          <p style="margin: 0; font-size: 14px; color: #555;">Our team will contact you shortly on <strong>${order.customer_phone}</strong> to finalize your session date and provide M-Pesa payment instructions.</p>
        </div>

        <div style="margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 30px;">
          <p style="font-size: 13px; color: #999; margin-bottom: 5px;">Need help? Contact us via WhatsApp or Email</p>
          <p style="font-size: 14px; font-weight: bold;">
            <a href="https://wa.me/254720111928" style="color: ${brandColors.skyBlue}; text-decoration: none;">WhatsApp</a> | 
            <a href="mailto:info@fiestahouseattire.com" style="color: ${brandColors.magenta}; text-decoration: none;">info@fiestahouseattire.com</a>
          </p>
        </div>
      </div>
      <div style="text-align: center; padding: 20px; font-size: 11px; color: #aaa;">
        &copy; 2026 Fiesta House Attire. Diamond Plaza, Nairobi. All rights reserved.
      </div>
    </div>
  `;

  // Send to Admin
  await transporter.sendMail({
    from: '"Fiesta House Shop" <' + process.env.SMTP_USER + '>',
    to: 'info@fiestahouseattire.com', // Admin email
    subject: `New Shop Order: ${order.customer_name}`,
    html: adminEmailContent
  });

  // Send to Customer
  await transporter.sendMail({
    from: '"Fiesta House Attire" <' + process.env.SMTP_USER + '>',
    to: order.customer_email,
    subject: 'Your Fiesta House Order Confirmation',
    html: customerEmailContent
  });
}

// ─────────────────────────────────────────────────────────────────────────────

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
