const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');

const app = express();
const port = process.env.PORT || 5000;
const useSsl = process.env.DATABASE_SSL !== 'false';
const isProduction = process.env.NODE_ENV === 'production';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'change-me-access-secret';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret';
const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TTL || '15m';
const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_TTL || '30d';
const REFRESH_TOKEN_COOKIE = 'fh_refresh_token';
const CSRF_TOKEN_COOKIE = 'fh_csrf_token';
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5374',
  'http://localhost:5373',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://fiestahouseattire.vercel.app',
  'https://app.fiestahouseattire.com'
];

const configuredOrigins = (process.env.CORS_ORIGINS || defaultAllowedOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...configuredOrigins])];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  // Allow production subdomains on the same parent domain.
  if (/^https:\/\/[a-z0-9-]+\.fiestahouseattire\.com$/i.test(origin)) {
    return true;
  }

  return false;
};

if (!isProduction && (ACCESS_TOKEN_SECRET === 'change-me-access-secret' || REFRESH_TOKEN_SECRET === 'change-me-refresh-secret')) {
  console.warn('Using default JWT secrets in development. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in production.');
}

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl
    ? {
        rejectUnauthorized: false // Required for Supabase/hosted DBs
      }
    : false
});

// Supabase Storage Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const MAX_UPLOAD_SIZE_BYTES = Number(process.env.MAX_UPLOAD_SIZE_BYTES || 10 * 1024 * 1024);
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif'
]);

// Multer setup (memory + file type/size guard)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
      const error = new Error('Unsupported file type');
      error.code = 'UNSUPPORTED_FILE_TYPE';
      callback(error);
      return;
    }

    callback(null, true);
  }
});

app.set('trust proxy', 1);
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    // Do not throw here; thrown CORS errors bubble as 500 responses.
    callback(null, false);
  },
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

app.use((req, res, next) => {
  const isAuthRoute = req.path.startsWith('/auth');
  const isAdminRoute = req.path.startsWith('/admin');
  const isWriteMethod = req.method !== 'GET';

  if (isAuthRoute || isAdminRoute || isWriteMethod) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return next();
  }

  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=120');
  next();
});

const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 8 : 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' }
});

const authRefreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 60 : 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many refresh attempts. Please try again later.' }
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 40 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many upload attempts. Please try again later.' }
});

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many order attempts. Please try again later.' }
});

const sanitizePlainText = (value, maxLength = 500) => {
  if (typeof value !== 'string') return null;
  const stripped = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
  if (!stripped) return null;
  return stripped.slice(0, maxLength);
};

const sanitizeRichText = (value) => {
  if (typeof value !== 'string') return null;

  return sanitizeHtml(value, {
    allowedTags: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'img', 'pre', 'code', 'span', 'div'
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'title'],
      span: ['class'],
      div: ['class'],
      p: ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https']
    },
    transformTags: {
      a: (tagName, attribs) => {
        const href = typeof attribs.href === 'string' ? attribs.href : '';
        const isExternal = /^https?:\/\//i.test(href);
        return {
          tagName,
          attribs: {
            ...attribs,
            rel: isExternal ? 'noopener noreferrer nofollow' : 'noopener noreferrer'
          }
        };
      }
    }
  }).trim();
};

const sanitizeSlug = (value) => {
  const safe = sanitizePlainText(value, 180);
  if (!safe) return null;
  return safe
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const sanitizeOptionalUrl = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return null;

  try {
    const parsed = new URL(value.trim());
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

const sanitizeBlogPostForPublic = (post) => ({
  ...post,
  excerpt: sanitizePlainText(post.excerpt, 1200),
  content: sanitizeRichText(post.content)
});

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: isProduction ? '/backend/auth' : '/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000
});

const getCsrfCookieOptions = () => ({
  httpOnly: false,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000
});

const issueCsrfToken = (res) => {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  res.cookie(CSRF_TOKEN_COOKIE, csrfToken, getCsrfCookieOptions());
  return csrfToken;
};

const requireCsrfToken = (req, res, next) => {
  const csrfCookie = req.cookies[CSRF_TOKEN_COOKIE];
  const csrfHeader = req.get('x-csrf-token');

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ error: 'CSRF token validation failed' });
  }

  next();
};

const generateAccessToken = (user) => jwt.sign(
  { sub: user.id, email: user.email, role: user.role, type: 'access' },
  ACCESS_TOKEN_SECRET,
  { expiresIn: ACCESS_TOKEN_TTL }
);

const generateRefreshToken = (user, tokenId) => jwt.sign(
  { sub: user.id, type: 'refresh', tid: tokenId },
  REFRESH_TOKEN_SECRET,
  { expiresIn: REFRESH_TOKEN_TTL }
);

const persistRefreshToken = async ({ userId, refreshToken, userAgent, ipAddress }) => {
  const payload = jwt.decode(refreshToken);
  const expiresAt = new Date((payload.exp || 0) * 1000);

  await pool.query(
    `INSERT INTO user_refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, hashToken(refreshToken), expiresAt, userAgent || null, ipAddress || null]
  );
};

const issueAuthTokens = async (user, req, res) => {
  const tokenId = crypto.randomUUID();
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user, tokenId);

  await persistRefreshToken({
    userId: user.id,
    refreshToken,
    userAgent: req.get('user-agent'),
    ipAddress: req.ip
  });

  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, getRefreshCookieOptions());
  issueCsrfToken(res);

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    }
  };
};

const requireAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing access token' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    if (payload.type !== 'access' || payload.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
};

const initAuthDb = async () => {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
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
    console.log('✓ Auth token tables initialized');
  } catch (err) {
    console.error('Auth DB Init Error:', err);
  }
};

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

    // Ensure all packages exist and are up-to-date.
    // This fixes old databases that were seeded with only a subset of packages.
    const initialPackages = [
      {
        name: "Standard Package",
        price: 10000,
        duration: "1 hr 30 min",
        images_count: "6 edited soft copy images",
        outfits_count: "2 gowns & styling",
        color: "#6EC1E4",
        features: ["Professional makeup", "Full gown access", "Studio session"],
        popular: false,
          description: "A streamlined premium session for timeless, elegant portraits of your maternity journey."
      },
      {
        name: "Economy Package",
        price: 15000,
        duration: "2 hrs",
        images_count: "12 edited soft copy images",
        outfits_count: "3 gowns & styling",
        color: "#B84FA0",
        features: ["Professional makeup", "Full gown access", "Studio session"],
        popular: false,
        description: "Our most balanced package, offering more time and a wider variety of looks."
      },
      {
        name: "Executive Package",
        price: 20000,
        duration: "2 hrs 30 min",
        images_count: "15 edited soft copy images",
        outfits_count: "4 gowns & styling",
        color: "#6EC1E4",
        features: ["Professional makeup", "Full gown access", "1 A3 Mount included", "Studio session"],
        popular: false,
        description: "Level up with more outfits and a stunning A3 mount for your wall."
      },
      {
        name: "Gold Package",
        price: 30000,
        duration: "2 hrs 30 min",
        images_count: "20 edited soft copy images",
        outfits_count: "4 gowns & styling",
        color: "#B84FA0",
        features: ["Professional makeup", "8x8\" hardpage photobook", "Full gown access", "Studio session"],
        popular: true,
        description: "Capture your story in a high-quality photobook that will last generations."
      },
      {
        name: "Platinum Package",
        price: 35000,
        duration: "2 hrs 30 min",
        images_count: "25 edited soft copy images",
        outfits_count: "4 gowns & styling",
        color: "#6EC1E4",
        features: ["Professional makeup", "Customized Balloon Backdrop", "1 A3 mount included", "Full gown access"],
        popular: true,
        description: "Luxury meets artistry with a customized backdrop tailored to your style."
      },
      {
        name: "VIP Package",
        price: 45000,
        duration: "3 hrs 30 min",
        images_count: "25 edited soft copy images",
        outfits_count: "4 gowns & styling",
        color: "#B84FA0",
        features: ["Professional makeup", "Customized Balloon Backdrop", "8x8\" hardpage photobook", "Extended session"],
        popular: false,
        description: "The ultimate luxury experience with every detail curated for perfection."
      },
      {
        name: "VVIP Package",
        price: 50000,
        duration: "3 hrs 30 min",
        images_count: "30 edited soft copy images",
        outfits_count: "5 gowns & styling",
        color: "#6EC1E4",
        features: ["Professional makeup", "Styled Wig included", "Customized Balloon Backdrop", "8x8\" photobook + A3 mount"],
        popular: false,
        description: "Our most exclusive offering. Absolute luxury, more outfits, and premium styling."
      }
    ];

    for (const p of initialPackages) {
      const existing = await pool.query('SELECT id FROM shop_packages WHERE name = $1 LIMIT 1', [p.name]);

      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE shop_packages
           SET price = $2,
               description = $3,
               duration = $4,
               images_count = $5,
               outfits_count = $6,
               color = $7,
               popular = $8,
               features = $9,
               is_active = true
           WHERE id = $1`,
          [
            existing.rows[0].id,
            p.price,
            p.description,
            p.duration,
            p.images_count,
            p.outfits_count,
            p.color,
            p.popular || false,
            JSON.stringify(p.features)
          ]
        );
      } else {
        await pool.query(
          `INSERT INTO shop_packages (name, price, description, duration, images_count, outfits_count, color, popular, features, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
          [
            p.name,
            p.price,
            p.description,
            p.duration,
            p.images_count,
            p.outfits_count,
            p.color,
            p.popular || false,
            JSON.stringify(p.features)
          ]
        );
      }
    }
    console.log("✓ Shop database initialized");
  } catch (err) {
    console.error("Shop DB Init Error:", err);
  }
};

initShopDb();

// Initialize Videos Database
const initVideosDb = async () => {
  try {
    console.log("Checking videos database tables...");
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
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_videos_public_feed
      ON videos (is_active, is_featured DESC, sort_order ASC, created_at DESC);
    `);
    console.log("✓ Videos database initialized");
  } catch (err) {
    console.error("Videos DB Init Error:", err);
  }
};

initVideosDb();

// Initialize Blog Database bits used by runtime APIs.
const initBlogDb = async () => {
  try {
    console.log('Checking blog database tables...');
    await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_categories (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
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
        sort_order INTEGER DEFAULT 0,
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_post_categories (
        post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
        category_id UUID REFERENCES blog_categories(id) ON DELETE CASCADE,
        PRIMARY KEY (post_id, category_id)
      );
    `);
    await pool.query('ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0');
    await pool.query(
      `UPDATE blog_posts
       SET sort_order = ranked.rn - 1
       FROM (
         SELECT id, ROW_NUMBER() OVER (ORDER BY COALESCE(published_at, created_at) DESC, created_at DESC) AS rn
         FROM blog_posts
       ) ranked
       WHERE blog_posts.id = ranked.id
         AND blog_posts.sort_order IS NULL`
    );
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_blog_posts_public_order ON blog_posts (status, sort_order ASC, published_at DESC, created_at DESC)'
    );
    console.log('✓ Blog database initialized');
  } catch (err) {
    console.error('Blog DB Init Error:', err);
  }
};

initBlogDb();
initAuthDb();

// Routes

// --- Authentication API ---

app.post('/auth/login', authLoginLimiter, async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userResult = await pool.query(
      `SELECT id, email, password_hash, full_name, role, is_active
       FROM users
       WHERE lower(email) = lower($1)
       LIMIT 1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    if (!user.is_active || user.role !== 'admin') {
      return res.status(403).json({ error: 'Account is not allowed to sign in' });
    }

    const passwordCheck = await pool.query(
      'SELECT $1 = crypt($2, $1) AS valid',
      [user.password_hash, password]
    );

    if (!passwordCheck.rows[0].valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const authResponse = await issueAuthTokens(user, req, res);
    res.json(authResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/auth/refresh', authRefreshLimiter, requireCsrfToken, async (req, res) => {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

  if (!refreshToken) {
    return res.status(401).json({ error: 'Missing refresh token' });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    if (payload.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const currentTokenHash = hashToken(refreshToken);

    const tokenResult = await pool.query(
      `SELECT rt.id, rt.user_id, rt.revoked_at, rt.expires_at, u.email, u.full_name, u.role, u.is_active
       FROM user_refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1
       LIMIT 1`,
      [currentTokenHash]
    );

    if (tokenResult.rows.length === 0) {
      res.clearCookie(REFRESH_TOKEN_COOKIE, getRefreshCookieOptions());
      return res.status(401).json({ error: 'Refresh token not recognized' });
    }

    const tokenRow = tokenResult.rows[0];
    if (tokenRow.revoked_at || new Date(tokenRow.expires_at) < new Date() || !tokenRow.is_active) {
      res.clearCookie(REFRESH_TOKEN_COOKIE, getRefreshCookieOptions());
      return res.status(401).json({ error: 'Refresh token expired or revoked' });
    }

    const user = {
      id: tokenRow.user_id,
      email: tokenRow.email,
      full_name: tokenRow.full_name,
      role: tokenRow.role
    };

    const tokenId = crypto.randomUUID();
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user, tokenId);
    const newRefreshTokenHash = hashToken(newRefreshToken);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE user_refresh_tokens
         SET revoked_at = NOW(), replaced_by_token_hash = $1
         WHERE token_hash = $2`,
        [newRefreshTokenHash, currentTokenHash]
      );

      const decodedRefresh = jwt.decode(newRefreshToken);
      const expiresAt = new Date((decodedRefresh.exp || 0) * 1000);
      await client.query(
        `INSERT INTO user_refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, newRefreshTokenHash, expiresAt, req.get('user-agent') || null, req.ip || null]
      );

      await client.query('COMMIT');
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }

    res.cookie(REFRESH_TOKEN_COOKIE, newRefreshToken, getRefreshCookieOptions());
    issueCsrfToken(res);
    res.json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    res.clearCookie(REFRESH_TOKEN_COOKIE, getRefreshCookieOptions());
    res.clearCookie(CSRF_TOKEN_COOKIE, getCsrfCookieOptions());
    return res.status(401).json({ error: 'Failed to refresh session' });
  }
});

app.post('/auth/logout', authRefreshLimiter, requireCsrfToken, async (req, res) => {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];

  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await pool.query(
      'UPDATE user_refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL',
      [tokenHash]
    );
  }

  res.clearCookie(REFRESH_TOKEN_COOKIE, getRefreshCookieOptions());
  res.clearCookie(CSRF_TOKEN_COOKIE, getCsrfCookieOptions());
  res.json({ message: 'Logged out successfully' });
});

app.get('/auth/me', requireAdminAuth, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, email, full_name, role, is_active FROM users WHERE id = $1 LIMIT 1',
      [req.user.sub]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({ error: 'Account not available' });
    }

    const user = userResult.rows[0];
    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

// Get all portfolios with their images
app.get('/portfolios', async (req, res) => {
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

// Get a single portfolio by id or slug with its images
app.get('/portfolios/:idOrSlug', async (req, res) => {
  const { idOrSlug } = req.params;

  try {
    const portfolioResult = await pool.query(
      'SELECT * FROM portfolios WHERE id::text = $1 OR slug = $1 LIMIT 1',
      [idOrSlug]
    );

    if (portfolioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const portfolio = portfolioResult.rows[0];
    const imagesResult = await pool.query(
      'SELECT * FROM portfolio_images WHERE portfolio_id = $1 ORDER BY "order" ASC',
      [portfolio.id]
    );

    res.json({
      ...portfolio,
      images: imagesResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create a new portfolio
app.post('/portfolios', requireAdminAuth, async (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const slug = title.toLowerCase().replace(/ /g, '-');
  
  try {
    const orderResult = await pool.query('SELECT COALESCE(MAX("order"), -1) + 1 AS next_order FROM portfolios');
    const nextOrder = orderResult.rows[0].next_order;

    const result = await pool.query(
      'INSERT INTO portfolios (title, slug, "order") VALUES ($1, $2, $3) RETURNING *',
      [title, slug, nextOrder]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create portfolio' });
  }
});

// Add image to portfolio
app.post('/portfolios/:id/images', requireAdminAuth, async (req, res) => {
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
app.post('/portfolios/:id/images/bulk', requireAdminAuth, async (req, res) => {
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
app.post('/portfolios/:id/deduplicate', requireAdminAuth, async (req, res) => {
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
app.delete('/portfolios/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM portfolios WHERE id = $1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Reorder portfolios by explicit id sequence
app.patch('/portfolios/reorder', requireAdminAuth, async (req, res) => {
  const { portfolioIds } = req.body;

  if (!Array.isArray(portfolioIds) || portfolioIds.length === 0) {
    return res.status(400).json({ error: 'portfolioIds array is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < portfolioIds.length; i++) {
      await client.query(
        'UPDATE portfolios SET "order" = $1 WHERE id = $2',
        [i, portfolioIds[i]]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Portfolio order updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to reorder portfolios' });
  } finally {
    client.release();
  }
});

// Update portfolio (e.g., set cover image)
app.patch('/portfolios/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { cover_image_url, title, order } = req.body;
  
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
    if (order !== undefined) {
      query += `"order" = $${count}, `;
      params.push(order);
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
app.delete('/portfolio-images/:id', requireAdminAuth, async (req, res) => {
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
app.get('/folders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM folders ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Create folder
app.post('/folders', requireAdminAuth, async (req, res) => {
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
app.patch('/folders/:id', requireAdminAuth, async (req, res) => {
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
app.get('/assets', async (req, res) => {
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
app.post('/assets/bulk', requireAdminAuth, async (req, res) => {
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
app.post('/upload', requireAdminAuth, uploadLimiter, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = Math.round(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024));
      res.status(400).json({ error: `File too large. Maximum size is ${maxMb}MB.` });
      return;
    }

    if (err && err.code === 'UNSUPPORTED_FILE_TYPE') {
      res.status(400).json({ error: 'Unsupported file type. Please upload jpg, png, webp, avif, or gif.' });
      return;
    }

    res.status(400).json({ error: 'Invalid upload request' });
  });
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const safeOriginalName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${Date.now()}_${safeOriginalName}`;
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
app.post('/assets', requireAdminAuth, async (req, res) => {
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

// Move multiple assets to a folder (or root when folder_id is null)
app.patch('/assets/move', requireAdminAuth, async (req, res) => {
  const { assetIds, folder_id = null } = req.body;

  if (!Array.isArray(assetIds) || assetIds.length === 0) {
    return res.status(400).json({ error: 'assetIds array is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE assets SET folder_id = $1 WHERE id = ANY($2::uuid[]) RETURNING *',
      [folder_id, assetIds]
    );

    res.json({ updated: result.rows.length, assets: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to move assets' });
  }
});

// Delete asset
app.delete('/assets/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM assets WHERE id = $1', [id]);
    res.json({ message: 'Asset deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// --- Videos API ---

const normalizeVideoUrl = (value) => {
  if (typeof value !== 'string') return value;

  let url = value.trim().replace(/\s+/g, '');
  if (!url) return url;

  // Ensure protocol for common platform URLs.
  if (/^(www\.)?youtube\.com\//i.test(url)) url = `https://${url.replace(/^https?:\/\//i, '')}`;
  if (/^youtu\.be\//i.test(url)) url = `https://${url}`;
  if (/^vimeo\.com\//i.test(url)) url = `https://${url}`;

  // Normalize malformed YouTube short variants observed in production.
  url = url
    .replace(/https?:\/\/(www\.)?youtube\.comshorts\//i, 'https://youtube.com/shorts/')
    .replace(/https?:\/\/(www\.)?youtube\.comshort\//i, 'https://youtube.com/shorts/')
    .replace(/https?:\/\/(www\.)?youtube\.com\/short\//i, 'https://youtube.com/shorts/');

  return url;
};

const VIDEOS_PUBLIC_CACHE_TTL_MS = 60 * 1000;
let publicVideosCache = {
  data: null,
  cachedAt: 0,
};

const getCachedPublicVideos = () => {
  if (!publicVideosCache.data) return null;
  const isFresh = Date.now() - publicVideosCache.cachedAt < VIDEOS_PUBLIC_CACHE_TTL_MS;
  return isFresh ? publicVideosCache.data : null;
};

const setCachedPublicVideos = (videos) => {
  publicVideosCache = {
    data: videos,
    cachedAt: Date.now(),
  };
};

const invalidatePublicVideosCache = () => {
  publicVideosCache = {
    data: null,
    cachedAt: 0,
  };
};

// Public videos list
app.get('/videos', async (req, res) => {
  try {
    const cached = getCachedPublicVideos();
    if (cached) {
      return res.json(cached);
    }

    const result = await pool.query(
      `SELECT * FROM videos
       WHERE is_active = true
       ORDER BY is_featured DESC, sort_order ASC, created_at DESC`
    );
    const normalized = result.rows.map((row) => ({ ...row, video_url: normalizeVideoUrl(row.video_url) }));
    setCachedPublicVideos(normalized);
    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Admin videos list (includes inactive)
app.get('/admin/videos', requireAdminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM videos
       ORDER BY is_featured DESC, sort_order ASC, created_at DESC`
    );
    res.json(result.rows.map((row) => ({ ...row, video_url: normalizeVideoUrl(row.video_url) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch admin videos' });
  }
});

// Create video
app.post('/videos', requireAdminAuth, async (req, res) => {
  const {
    title,
    description,
    video_url,
    source_type = 'url',
    is_featured = false,
    sort_order,
    is_active = true,
  } = req.body;

  const normalizedVideoUrl = normalizeVideoUrl(video_url);

  if (!title || !normalizedVideoUrl) {
    return res.status(400).json({ error: 'Title and video_url are required' });
  }

  try {
    let nextOrder = sort_order;
    if (nextOrder === undefined || nextOrder === null) {
      const orderResult = await pool.query('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM videos');
      nextOrder = orderResult.rows[0].next_order;
    }

    const result = await pool.query(
      `INSERT INTO videos (title, description, video_url, source_type, is_featured, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description || null, normalizedVideoUrl, source_type, is_featured, nextOrder, is_active]
    );

    invalidatePublicVideosCache();
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create video' });
  }
});

// Update video
app.patch('/videos/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { title, description, video_url, source_type, is_featured, sort_order, is_active } = req.body;

  try {
    let query = 'UPDATE videos SET ';
    const params = [];
    let count = 1;

    if (title !== undefined) {
      query += `title = $${count}, `;
      params.push(title);
      count++;
    }
    if (description !== undefined) {
      query += `description = $${count}, `;
      params.push(description);
      count++;
    }
    if (video_url !== undefined) {
      query += `video_url = $${count}, `;
      params.push(normalizeVideoUrl(video_url));
      count++;
    }
    if (source_type !== undefined) {
      query += `source_type = $${count}, `;
      params.push(source_type);
      count++;
    }
    if (is_featured !== undefined) {
      query += `is_featured = $${count}, `;
      params.push(is_featured);
      count++;
    }
    if (sort_order !== undefined) {
      query += `sort_order = $${count}, `;
      params.push(sort_order);
      count++;
    }
    if (is_active !== undefined) {
      query += `is_active = $${count}, `;
      params.push(is_active);
      count++;
    }

    if (params.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    query += `updated_at = NOW() `;
    query += `WHERE id = $${count} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    invalidatePublicVideosCache();
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Delete video
app.delete('/videos/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM videos WHERE id = $1', [id]);
    invalidatePublicVideosCache();
    res.json({ message: 'Video deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Reorder videos by explicit id sequence
app.patch('/videos/reorder', requireAdminAuth, async (req, res) => {
  const { videoIds } = req.body;

  if (!Array.isArray(videoIds) || videoIds.length === 0) {
    return res.status(400).json({ error: 'videoIds array is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < videoIds.length; i++) {
      await client.query(
        'UPDATE videos SET sort_order = $1, updated_at = NOW() WHERE id = $2',
        [i, videoIds[i]]
      );
    }

    await client.query('COMMIT');
    invalidatePublicVideosCache();
    res.json({ message: 'Video order updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to reorder videos' });
  } finally {
    client.release();
  }
});

// ─── Blog API ────────────────────────────────────────────────────────────────

// GET /blog-categories — all categories
app.get('/blog-categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM blog_categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /blog-categories — create category
app.post('/blog-categories', requireAdminAuth, async (req, res) => {
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

// GET /blog-posts — published posts (paginated, optional ?category=slug)
app.get('/blog-posts', async (req, res) => {
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

    baseQuery += ' GROUP BY p.id ORDER BY p.sort_order ASC, p.published_at DESC, p.created_at DESC';

    let countQuery = `SELECT COUNT(p.id) FROM blog_posts p WHERE p.status = 'published'`;
    const countParams = [];

    if (category) {
      countParams.push(category);
      countQuery += ` AND EXISTS (
        SELECT 1 FROM blog_post_categories pc2
        JOIN blog_categories c2 ON c2.id = pc2.category_id
        WHERE pc2.post_id = p.id AND c2.slug = $${countParams.length}
      )`;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const result = await pool.query(
      `${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      posts: result.rows.map(sanitizeBlogPostForPublic),
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /blog-posts/:slug/related — published posts with overlapping categories
app.get('/blog-posts/:slug/related', async (req, res) => {
  const { slug } = req.params;
  const limit = Math.max(1, Math.min(12, Number(req.query.limit) || 4));

  try {
    const sourcePost = await pool.query('SELECT id FROM blog_posts WHERE slug = $1 LIMIT 1', [slug]);
    if (sourcePost.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const sourceId = sourcePost.rows[0].id;

    const related = await pool.query(
      `SELECT p.*, 
          COALESCE(
            json_agg(json_build_object('id', c.id, 'name', c.name, 'slug', c.slug))
            FILTER (WHERE c.id IS NOT NULL), '[]'
          ) AS categories,
          COUNT(DISTINCT shared.category_id) AS shared_count
       FROM blog_posts p
       LEFT JOIN blog_post_categories pc ON pc.post_id = p.id
       LEFT JOIN blog_categories c ON c.id = pc.category_id
       LEFT JOIN blog_post_categories shared ON shared.post_id = p.id
         AND shared.category_id IN (
           SELECT category_id FROM blog_post_categories WHERE post_id = $1
         )
       WHERE p.status = 'published'
         AND p.id <> $1
       GROUP BY p.id
       HAVING COUNT(DISTINCT shared.category_id) > 0
       ORDER BY shared_count DESC, p.sort_order ASC, p.published_at DESC, p.created_at DESC
       LIMIT $2`,
      [sourceId, limit]
    );

    res.json(related.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch related posts' });
  }
});

// GET /blog-posts/all — ALL posts including drafts (admin)
app.get('/blog-posts/all', requireAdminAuth, async (req, res) => {
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
      ORDER BY p.sort_order ASC, p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// PATCH /blog-posts/reorder — reorder posts by explicit id sequence
app.patch('/blog-posts/reorder', requireAdminAuth, async (req, res) => {
  const { postIds } = req.body;

  if (!Array.isArray(postIds) || postIds.length === 0) {
    return res.status(400).json({ error: 'postIds array is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (let i = 0; i < postIds.length; i++) {
      await client.query(
        'UPDATE blog_posts SET sort_order = $1, updated_at = NOW() WHERE id = $2',
        [i, postIds[i]]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Blog post order updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to reorder blog posts' });
  } finally {
    client.release();
  }
});

// GET /blog-posts/:slug — single post by slug
app.get('/blog-posts/:slug', async (req, res) => {
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
    res.json(sanitizeBlogPostForPublic(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /blog-posts — create post
app.post('/blog-posts', requireAdminAuth, async (req, res) => {
  const { title, slug, excerpt, content, cover_image_url, author, status, published_at, category_ids, sort_order } = req.body;

  const safeTitle = sanitizePlainText(title, 180);
  const safeSlug = sanitizeSlug(slug);
  const safeExcerpt = sanitizePlainText(excerpt, 1200);
  const safeContent = sanitizeRichText(content);
  const safeCoverImageUrl = sanitizeOptionalUrl(cover_image_url);
  const safeAuthor = sanitizePlainText(author || 'admin', 80) || 'admin';

  if (!safeTitle || !safeSlug) return res.status(400).json({ error: 'Title and slug are required' });
  try {
    let nextOrder = sort_order;
    if (nextOrder === undefined || nextOrder === null || Number.isNaN(Number(nextOrder))) {
      const orderResult = await pool.query('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM blog_posts');
      nextOrder = Number(orderResult.rows[0].next_order) || 0;
    }

    const result = await pool.query(
      `INSERT INTO blog_posts (title, slug, excerpt, content, cover_image_url, author, status, published_at, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [safeTitle, safeSlug, safeExcerpt, safeContent, safeCoverImageUrl, safeAuthor, status || 'draft',
       status === 'published' ? (published_at || new Date().toISOString()) : published_at,
       nextOrder]
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

// PUT /blog-posts/:id — update post
app.put('/blog-posts/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { title, slug, excerpt, content, cover_image_url, author, status, published_at, category_ids, sort_order } = req.body;

  const safeTitle = sanitizePlainText(title, 180);
  const safeSlug = sanitizeSlug(slug);
  const safeExcerpt = sanitizePlainText(excerpt, 1200);
  const safeContent = sanitizeRichText(content);
  const safeCoverImageUrl = sanitizeOptionalUrl(cover_image_url);
  const safeAuthor = sanitizePlainText(author || 'admin', 80) || 'admin';

  if (!safeTitle || !safeSlug) {
    return res.status(400).json({ error: 'Title and slug are required' });
  }

  try {
    const result = await pool.query(
      `UPDATE blog_posts SET
         title=$1, slug=$2, excerpt=$3, content=$4, cover_image_url=$5,
         author=$6, status=$7, published_at=$8, sort_order=COALESCE($9, sort_order), updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [safeTitle, safeSlug, safeExcerpt, safeContent, safeCoverImageUrl, safeAuthor, status,
       status === 'published' ? (published_at || new Date().toISOString()) : published_at,
       sort_order,
       id]
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

// DELETE /blog-posts/:id
app.delete('/blog-posts/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM blog_posts WHERE id = $1', [id]);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// GET /blog-posts-recent — last 3 published (for sidebar)
app.get('/blog-posts-recent', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, slug, cover_image_url, published_at FROM blog_posts
       WHERE status='published' ORDER BY sort_order ASC, published_at DESC, created_at DESC LIMIT 5`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent posts' });
  }
});

// ─── Shop API ────────────────────────────────────────────────────────────────

// GET /shop/packages — all active packages
app.get('/shop/packages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shop_packages WHERE is_active = true ORDER BY price ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch shop packages' });
  }
});

// GET /admin/shop/packages — all packages for admin editing
app.get('/admin/shop/packages', requireAdminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shop_packages ORDER BY price ASC, name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch admin shop packages' });
  }
});

// PATCH /admin/shop/packages/:id — update package fields
app.patch('/admin/shop/packages/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    price,
    duration,
    images_count,
    outfits_count,
    features
  } = req.body || {};

  const fields = [];
  const params = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name must be a non-empty string' });
    }
    fields.push(`name = $${fields.length + 1}`);
    params.push(name.trim());
  }

  if (description !== undefined) {
    if (description !== null && typeof description !== 'string') {
      return res.status(400).json({ error: 'description must be a string or null' });
    }
    fields.push(`description = $${fields.length + 1}`);
    params.push(description === null ? null : description.trim());
  }

  if (price !== undefined) {
    const normalizedPrice = Number(price);
    if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
      return res.status(400).json({ error: 'price must be a valid non-negative number' });
    }
    fields.push(`price = $${fields.length + 1}`);
    params.push(Math.round(normalizedPrice));
  }

  if (duration !== undefined) {
    if (duration !== null && typeof duration !== 'string') {
      return res.status(400).json({ error: 'duration must be a string or null' });
    }
    fields.push(`duration = $${fields.length + 1}`);
    params.push(duration === null ? null : duration.trim());
  }

  if (images_count !== undefined) {
    if (images_count !== null && typeof images_count !== 'string') {
      return res.status(400).json({ error: 'images_count must be a string or null' });
    }
    fields.push(`images_count = $${fields.length + 1}`);
    params.push(images_count === null ? null : images_count.trim());
  }

  if (outfits_count !== undefined) {
    if (outfits_count !== null && typeof outfits_count !== 'string') {
      return res.status(400).json({ error: 'outfits_count must be a string or null' });
    }
    fields.push(`outfits_count = $${fields.length + 1}`);
    params.push(outfits_count === null ? null : outfits_count.trim());
  }

  if (features !== undefined) {
    if (!Array.isArray(features)) {
      return res.status(400).json({ error: 'features must be an array of strings' });
    }

    const normalizedFeatures = features
      .map((feature) => (typeof feature === 'string' ? feature.trim() : ''))
      .filter(Boolean);

    fields.push(`features = $${fields.length + 1}::jsonb`);
    params.push(JSON.stringify(normalizedFeatures));
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No editable fields provided' });
  }

  params.push(id);

  try {
    const result = await pool.query(
      `UPDATE shop_packages SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update package' });
  }
});

// POST /shop/orders — create new order and send emails
app.post('/shop/orders', orderLimiter, async (req, res) => {
  const { customer_name, customer_email, customer_phone, items, total_amount } = req.body;
  
  if (!customer_name || !customer_email || !customer_phone || !items || items.length === 0) {
    return res.status(400).json({ error: 'Missing required order details' });
  }

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items must be an array' });
  }

  const normalizedItems = items
    .map((item) => {
      const packageId = typeof item?.id === 'string' ? item.id : null;
      const quantity = Number(item?.quantity);
      if (!packageId || !Number.isInteger(quantity) || quantity <= 0 || quantity > 20) {
        return null;
      }
      return { packageId, quantity };
    })
    .filter(Boolean);

  if (normalizedItems.length !== items.length) {
    return res.status(400).json({ error: 'Each order item must include a valid package id and quantity' });
  }

  const packageIds = [...new Set(normalizedItems.map((item) => item.packageId))];

  let packageResult;
  try {
    packageResult = await pool.query(
      `SELECT id, name, price, is_active
       FROM shop_packages
       WHERE id = ANY($1::uuid[])`,
      [packageIds]
    );
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: 'Invalid package ids provided' });
  }

  const packageMap = new Map(packageResult.rows.map((pkg) => [pkg.id, pkg]));
  if (packageMap.size !== packageIds.length) {
    return res.status(400).json({ error: 'One or more packages were not found' });
  }

  const inactivePackage = packageResult.rows.find((pkg) => !pkg.is_active);
  if (inactivePackage) {
    return res.status(400).json({ error: `Package is not available: ${inactivePackage.name}` });
  }

  const orderItems = normalizedItems.map((item) => {
    const pkg = packageMap.get(item.packageId);
    return {
      id: pkg.id,
      name: pkg.name,
      price: Number(pkg.price),
      quantity: item.quantity
    };
  });

  const computedTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const submittedTotal = Number(total_amount);
  if (Number.isFinite(submittedTotal) && submittedTotal !== computedTotal) {
    return res.status(400).json({ error: 'Order total mismatch. Please refresh and try again.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create order
    const orderResult = await client.query(
      `INSERT INTO shop_orders (customer_name, customer_email, customer_phone, total_amount) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [customer_name, customer_email, customer_phone, computedTotal]
    );
    const order = orderResult.rows[0];

    // Create order items
    for (const item of orderItems) {
      await client.query(
        `INSERT INTO shop_order_items (order_id, package_id, package_name, price, quantity) 
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.id, item.name, item.price, item.quantity]
      );
    }

    await client.query('COMMIT');

    // Send Email Notifications (Fire and forget, don't block response)
    sendOrderEmails(order, orderItems).catch(err => console.error('Email error:', err));

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

// ─── Live SEO endpoints (sitemap, image sitemap, robots) ─────────────────────
// Served fresh from the database on every request — publish a blog post or a
// portfolio and it appears here immediately, no deploy needed.
// The public site URL comes from one env var so a future domain change is a
// single setting: set SITE_URL in Vercel and everything follows.

const SITEMAP_SITE_URL = (process.env.SITE_URL || 'https://www.fiestahousematernity.com').replace(/\/$/, '');
const MATERNITY_GOWNS_FOLDER_ID = 'b8b100e9-81ce-4778-bf57-0adee0b46fc0';
const IMAGE_SITEMAP_FALLBACK_IMAGE = `${SITEMAP_SITE_URL}/og-image.jpg`;

const STATIC_ROUTES = [
  { path: '/', priority: '1.0' },
  { path: '/portfolio', priority: '0.8' },
  { path: '/maternity-gowns', priority: '0.8' },
  { path: '/pricing', priority: '0.8' },
  { path: '/blog', priority: '0.8' },
  { path: '/videos', priority: '0.8' },
  { path: '/experience', priority: '0.7' },
  { path: '/about', priority: '0.7' },
  { path: '/contact', priority: '0.7' },
  { path: '/shop', priority: '0.6' },
];

const xmlEscape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const isoDate = (d) => {
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

app.get('/sitemap.xml', async (req, res) => {
  try {
    const urls = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const r of STATIC_ROUTES) {
      urls.push(
        `  <url>\n    <loc>${SITEMAP_SITE_URL}${r.path === '/' ? '/' : r.path}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${r.priority}</priority>\n  </url>`
      );
    }

    const [posts, portfolios] = await Promise.all([
      pool.query(
        `SELECT slug, COALESCE(updated_at, published_at, created_at) AS lastmod
         FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC`
      ),
      pool.query(`SELECT slug, created_at AS lastmod FROM portfolios ORDER BY "order" ASC`),
    ]);

    for (const p of portfolios.rows) {
      urls.push(
        `  <url>\n    <loc>${SITEMAP_SITE_URL}/portfolio/${xmlEscape(p.slug)}</loc>\n    <lastmod>${isoDate(p.lastmod)}</lastmod>\n    <priority>0.7</priority>\n  </url>`
      );
    }

    for (const p of posts.rows) {
      urls.push(
        `  <url>\n    <loc>${SITEMAP_SITE_URL}/blog/${xmlEscape(p.slug)}</loc>\n    <lastmod>${isoDate(p.lastmod)}</lastmod>\n    <priority>0.6</priority>\n  </url>`
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    console.error('sitemap error', err);
    res.status(500).send('sitemap unavailable');
  }
});

app.get('/image-sitemap.xml', async (req, res) => {
  try {
    const [portfolioImages, portfolioCovers, blogCovers, gownAssets] = await Promise.all([
      pool.query(
        `SELECT p.slug, pi.url
         FROM portfolio_images pi
         JOIN portfolios p ON p.id = pi.portfolio_id
         ORDER BY p."order" ASC, pi."order" ASC`
      ),
      pool.query(
        `SELECT slug, cover_image_url AS url
         FROM portfolios
         WHERE cover_image_url IS NOT NULL AND TRIM(cover_image_url) <> ''
         ORDER BY "order" ASC`
      ),
      pool.query(
        `SELECT slug, cover_image_url AS url
         FROM blog_posts
         WHERE status = 'published' AND cover_image_url IS NOT NULL AND TRIM(cover_image_url) <> ''
         ORDER BY COALESCE(updated_at, published_at, created_at) DESC`
      ),
      pool.query(
        `SELECT url
         FROM assets
         WHERE folder_id = $1 AND url IS NOT NULL AND TRIM(url) <> ''
         ORDER BY created_at DESC`,
        [MATERNITY_GOWNS_FOLDER_ID]
      ),
    ]);

    const byPage = new Map();
    const addImage = (pagePath, imageUrl) => {
      if (!pagePath || !imageUrl) return;
      const trimmed = String(imageUrl).trim();
      if (!/^https?:\/\//i.test(trimmed)) return;
      if (!byPage.has(pagePath)) byPage.set(pagePath, new Set());
      byPage.get(pagePath).add(trimmed);
    };

    for (const row of portfolioImages.rows) {
      if (!row.slug) continue;
      addImage(`/portfolio/${row.slug}`, row.url);
    }

    for (const row of portfolioCovers.rows) {
      if (!row.slug) continue;
      addImage(`/portfolio/${row.slug}`, row.url);
    }

    for (const row of blogCovers.rows) {
      if (!row.slug) continue;
      addImage(`/blog/${row.slug}`, row.url);
    }

    for (const row of gownAssets.rows) {
      addImage('/maternity-gowns', row.url);
    }

    // Search Console rejects an image sitemap with zero <url> entries.
    if (byPage.size === 0) {
      addImage('/', IMAGE_SITEMAP_FALLBACK_IMAGE);
    }

    const urls = [];
    const sortedPages = [...byPage.keys()].sort((a, b) => a.localeCompare(b));
    for (const pagePath of sortedPages) {
      const images = [...byPage.get(pagePath)].slice(0, 1000);
      if (images.length === 0) continue;

      const imageTags = images
        .map((u) => `    <image:image>\n      <image:loc>${xmlEscape(u)}</image:loc>\n    </image:image>`)
        .join('\n');

      urls.push(
        `  <url>\n    <loc>${SITEMAP_SITE_URL}${pagePath === '/' ? '/' : pagePath}</loc>\n${imageTags}\n  </url>`
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`;
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    console.error('image sitemap error', err);
    res.status(500).send('image sitemap unavailable');
  }
});

app.get('/robots.txt', (req, res) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /cart',
    'Disallow: /checkout',
    '',
    `Sitemap: ${SITEMAP_SITE_URL}/sitemap.xml`,
    `Sitemap: ${SITEMAP_SITE_URL}/image-sitemap.xml`,
    '',
  ].join('\n');
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(body);
});

// ─────────────────────────────────────────────────────────────────────────────

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

