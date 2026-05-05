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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
