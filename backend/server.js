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
const sanitizeHtmlModule = require('sanitize-html');

let hasWarnedAboutSanitizeHtmlFallback = false;
const sanitizeHtml = (...args) => {
  const candidate =
    typeof sanitizeHtmlModule === 'function'
      ? sanitizeHtmlModule
      : (sanitizeHtmlModule && typeof sanitizeHtmlModule.default === 'function'
        ? sanitizeHtmlModule.default
        : null);

  if (candidate) {
    return candidate(...args);
  }

  if (!hasWarnedAboutSanitizeHtmlFallback) {
    hasWarnedAboutSanitizeHtmlFallback = true;
    console.error('sanitize-html module did not expose a callable export; using strip-tag fallback');
  }

  const input = args[0];
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '');
};

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
  const isMutableContentReadRoute = req.path.startsWith('/assets') || req.path.startsWith('/folders') || req.path.startsWith('/portfolios');

  if (isAuthRoute || isAdminRoute || isWriteMethod || isMutableContentReadRoute) {
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

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 15 : 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many contact attempts. Please try again later.' }
});

const MAX_ANALYTICS_PAGE_SIZE = 200;
const DEFAULT_ANALYTICS_PAGE_SIZE = 50;

const CONTACT_TEST_RECIPIENT = process.env.CONTACT_TEST_EMAIL || 'info@fiestahouseattire.com';

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

const BLOCK_HTML_TAG_REGEX = /<(p|h1|h2|h3|h4|h5|h6|ul|ol|li|blockquote|img|pre|table|br)\b/i;
const MARKDOWN_HEADING_REGEX = /^(#{1,6})\s+(.+)$/;

const escapeHtmlForRichText = (value) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\"/g, '&quot;')
  .replace(/'/g, '&#39;');

const normalizeHeadingText = (value) => {
  let next = value.trim();
  const boldWrapped = next.match(/^\*\*(.+)\*\*$/);
  if (boldWrapped) {
    next = boldWrapped[1].trim();
  }
  return next;
};

const convertPlainTextToRichHtml = (rawValue) => {
  const normalized = rawValue.replace(/\r\n?/g, '\n').trim();
  if (!normalized) return '';

  const lines = normalized.split('\n');
  const blocks = [];
  let paragraphBuffer = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    const paragraphText = paragraphBuffer.join(' ').replace(/\s+/g, ' ').trim();
    if (paragraphText) {
      blocks.push(`<p>${escapeHtmlForRichText(paragraphText)}</p>`);
    }
    paragraphBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    const headingMatch = trimmed.match(MARKDOWN_HEADING_REGEX);
    if (headingMatch) {
      flushParagraph();
      const level = Math.min(6, Math.max(1, headingMatch[1].length));
      const headingText = normalizeHeadingText(headingMatch[2]);
      if (headingText) {
        blocks.push(`<h${level}>${escapeHtmlForRichText(headingText)}</h${level}>`);
      }
      continue;
    }

    const boldOnlyLine = trimmed.match(/^\*\*(.+)\*\*$/);
    if (boldOnlyLine) {
      flushParagraph();
      const headingText = normalizeHeadingText(boldOnlyLine[1]);
      if (headingText) {
        blocks.push(`<h3>${escapeHtmlForRichText(headingText)}</h3>`);
      }
      continue;
    }

    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  return blocks.join('\n');
};

const normalizeRichTextInput = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (BLOCK_HTML_TAG_REGEX.test(trimmed)) return trimmed;
  return convertPlainTextToRichHtml(trimmed);
};

const sanitizeSlug = (value) => {
  const safe = sanitizePlainText(value, 180);
  if (!safe) return null;
  return safe
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const normalizePublicFolderSlug = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return normalized || null;
};

const ensureUniqueFolderPublicSlug = async (client, rawSlug, excludeFolderId = null) => {
  const baseSlug = normalizePublicFolderSlug(rawSlug) || 'gallery';
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const conflictQuery = excludeFolderId
      ? 'SELECT 1 FROM folders WHERE public_slug = $1 AND id <> $2 LIMIT 1'
      : 'SELECT 1 FROM folders WHERE public_slug = $1 LIMIT 1';
    const conflictParams = excludeFolderId ? [candidate, excludeFolderId] : [candidate];
    const conflict = await client.query(conflictQuery, conflictParams);

    if (conflict.rows.length === 0) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
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

const initMediaVisibilityDb = async () => {
  try {
    await pool.query('ALTER TABLE folders ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true');
    await pool.query('ALTER TABLE folders ADD COLUMN IF NOT EXISTS public_slug TEXT');
    await pool.query('ALTER TABLE assets ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true');
    await pool.query('UPDATE folders SET is_public = true WHERE is_public IS NULL');
    await pool.query('UPDATE assets SET is_public = true WHERE is_public IS NULL');
    await pool.query(`
      UPDATE folders
      SET public_slug = regexp_replace(regexp_replace(lower(COALESCE(name, 'gallery')), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')
      WHERE public_slug IS NULL OR btrim(public_slug) = ''
    `);
    await pool.query(`
      WITH ranked AS (
        SELECT id, public_slug, ROW_NUMBER() OVER (PARTITION BY public_slug ORDER BY created_at ASC, id ASC) AS rn
        FROM folders
        WHERE public_slug IS NOT NULL
      )
      UPDATE folders f
      SET public_slug = f.public_slug || '-' || (ranked.rn - 1)::text
      FROM ranked
      WHERE f.id = ranked.id
        AND ranked.rn > 1
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_folders_is_public ON folders (is_public, name)');
    await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_public_slug_unique ON folders (public_slug) WHERE public_slug IS NOT NULL');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_assets_public_folder_created ON assets (is_public, folder_id, created_at DESC)');
    console.log('✓ Media visibility columns initialized');
  } catch (err) {
    console.error('Media visibility DB Init Error:', err);
  }
};

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

const initAnalyticsDb = async () => {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        event_name TEXT NOT NULL,
        label TEXT,
        page_url TEXT,
        session_id TEXT,
        referrer TEXT,
        device_type TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_events_event_name_created_at ON events(event_name, created_at DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_events_device_type_created_at ON events(device_type, created_at DESC)');
    console.log('✓ Analytics events table initialized');
  } catch (err) {
    console.error('Analytics DB Init Error:', err);
  }
};

initBlogDb();
initAuthDb();
initMediaVisibilityDb();
initAnalyticsDb();

const getAnalyticsDateRange = (req) => {
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const fromRaw = typeof req.query.from === 'string' ? req.query.from : null;
  const toRaw = typeof req.query.to === 'string' ? req.query.to : null;

  const parseDateInput = (value, endOfDay = false) => {
    if (!value) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;

    // If client sends YYYY-MM-DD, expand to full-day UTC boundaries.
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return new Date(`${trimmed}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
    }

    return new Date(trimmed);
  };

  const fromDate = fromRaw ? (parseDateInput(fromRaw, false) || defaultFrom) : defaultFrom;
  const toDate = toRaw ? (parseDateInput(toRaw, true) || now) : now;

  const safeFrom = Number.isNaN(fromDate.getTime()) ? defaultFrom : fromDate;
  const safeTo = Number.isNaN(toDate.getTime()) ? now : toDate;

  const from = safeFrom <= safeTo ? safeFrom : safeTo;
  const to = safeTo >= safeFrom ? safeTo : safeFrom;

  return { from, to };
};

const getPreviousAnalyticsDateRange = (from, to) => {
  const currentSpanMs = Math.max(0, to.getTime() - from.getTime());
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - currentSpanMs);
  return { from: previousFrom, to: previousTo };
};

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

app.post('/api/track', async (req, res) => {
  const body = req.body || {};
  const eventName = typeof body.event_name === 'string' ? body.event_name.trim().slice(0, 120) : '';

  if (!eventName) {
    return res.status(202).json({ ok: true });
  }

  const label = typeof body.label === 'string' ? body.label.trim().slice(0, 300) : null;
  const pageUrl = typeof body.page_url === 'string' ? body.page_url.trim().slice(0, 500) : null;
  const sessionId = typeof body.session_id === 'string' ? body.session_id.trim().slice(0, 128) : null;
  const referrer = typeof body.referrer === 'string' ? body.referrer.trim().slice(0, 500) : null;
  const deviceType = typeof body.device_type === 'string' ? body.device_type.trim().slice(0, 40) : null;
  const rawTimestamp = typeof body.timestamp === 'string' ? body.timestamp : null;
  const parsedTimestamp = rawTimestamp ? new Date(rawTimestamp) : null;
  const createdAt = parsedTimestamp && !Number.isNaN(parsedTimestamp.getTime()) ? parsedTimestamp : new Date();

  pool.query(
    `INSERT INTO events (event_name, label, page_url, session_id, referrer, device_type, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [eventName, label, pageUrl, sessionId, referrer, deviceType, createdAt]
  ).catch((error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('track insert failed', error);
    }
  });

  return res.status(202).json({ ok: true });
});

app.get('/admin/analytics/top-clicks', requireAdminAuth, async (req, res) => {
  const { from, to } = getAnalyticsDateRange(req);
  const limitRaw = Number(req.query.limit || 12);
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(50, Math.floor(limitRaw)))
    : 12;

  try {
    const result = await pool.query(
      `SELECT event_name, COALESCE(NULLIF(label, ''), '(no label)') AS label, COUNT(*)::int AS count
       FROM events
       WHERE created_at >= $1
         AND created_at <= $2
         AND event_name <> 'page_view'
         AND event_name NOT LIKE 'debug_%'
       GROUP BY event_name, label
       ORDER BY count DESC
       LIMIT $3`,
      [from.toISOString(), to.toISOString(), limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('admin analytics top-clicks error', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/admin/analytics/business-kpis', requireAdminAuth, async (req, res) => {
  const { from, to } = getAnalyticsDateRange(req);

  try {
    const result = await pool.query(
      `WITH in_range AS (
         SELECT event_name, page_url, session_id, created_at
         FROM events
         WHERE created_at >= $1
           AND created_at <= $2
           AND event_name NOT LIKE 'debug_%'
       ),
       base AS (
         SELECT
           COUNT(DISTINCT NULLIF(session_id, ''))::int AS unique_visitors,
           COUNT(*) FILTER (WHERE event_name = 'whatsapp_click')::int AS whatsapp_leads,
           COUNT(*) FILTER (WHERE event_name IN ('gallery_image_open', 'video_gallery_click'))::int AS portfolio_engagement,
           COUNT(*) FILTER (WHERE event_name IN ('booking_click', 'checkout_start', 'checkout_form_start', 'package_click'))::int AS booking_intent,
           COUNT(DISTINCT NULLIF(session_id, '')) FILTER (WHERE event_name <> 'page_view')::int AS engaged_sessions
         FROM in_range
       ),
       returning_sessions AS (
         SELECT COUNT(*)::int AS returning_visitors
         FROM (
           SELECT session_id
           FROM in_range
           WHERE session_id IS NOT NULL AND session_id <> ''
           GROUP BY session_id
           HAVING COUNT(DISTINCT DATE(created_at)) > 1
         ) r
       )
       SELECT
         b.unique_visitors,
         b.whatsapp_leads,
         b.portfolio_engagement,
         b.booking_intent,
         b.engaged_sessions,
         r.returning_visitors
       FROM base b
       CROSS JOIN returning_sessions r`,
      [from.toISOString(), to.toISOString()]
    );

    const row = result.rows[0] || {};
    const uniqueVisitors = Number(row.unique_visitors || 0);
    const engagedSessions = Number(row.engaged_sessions || 0);

    res.json({
      unique_visitors: uniqueVisitors,
      whatsapp_leads: Number(row.whatsapp_leads || 0),
      portfolio_engagement: Number(row.portfolio_engagement || 0),
      booking_intent: Number(row.booking_intent || 0),
      returning_visitors: Number(row.returning_visitors || 0),
      conversion_rate: uniqueVisitors > 0 ? Number(((engagedSessions / uniqueVisitors) * 100).toFixed(2)) : 0,
    });
  } catch (err) {
    console.error('admin analytics business-kpis error', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/admin/analytics/funnel', requireAdminAuth, async (req, res) => {
  const { from, to } = getAnalyticsDateRange(req);

  try {
    const result = await pool.query(
      `WITH in_range AS (
         SELECT event_name, page_url, session_id
         FROM events
         WHERE created_at >= $1
           AND created_at <= $2
           AND event_name NOT LIKE 'debug_%'
       ),
       sessions AS (
         SELECT DISTINCT session_id
         FROM in_range
         WHERE session_id IS NOT NULL AND session_id <> ''
       )
       SELECT
         (SELECT COUNT(*)::int FROM sessions) AS visitors,
         (SELECT COUNT(DISTINCT s.session_id)::int
          FROM sessions s
          JOIN in_range e ON e.session_id = s.session_id
          WHERE e.event_name IN ('gallery_image_open', 'video_gallery_click')
             OR e.page_url LIKE '/portfolio%'
             OR e.page_url LIKE '/maternity-gowns%') AS portfolio_interest,
         (SELECT COUNT(DISTINCT s.session_id)::int
          FROM sessions s
          JOIN in_range e ON e.session_id = s.session_id
          WHERE e.event_name = 'package_click'
             OR e.page_url LIKE '/pricing%') AS pricing_interest,
         (SELECT COUNT(DISTINCT s.session_id)::int
          FROM sessions s
          JOIN in_range e ON e.session_id = s.session_id
          WHERE e.event_name = 'whatsapp_click') AS whatsapp,
         (SELECT COUNT(DISTINCT s.session_id)::int
          FROM sessions s
          JOIN in_range e ON e.session_id = s.session_id
          WHERE e.event_name IN ('booking_click', 'checkout_start', 'checkout_form_start')) AS booking,
         (SELECT COUNT(DISTINCT s.session_id)::int
          FROM sessions s
          JOIN in_range e ON e.session_id = s.session_id
          WHERE e.event_name IN ('checkout_start', 'checkout_form_start')) AS checkout`,
      [from.toISOString(), to.toISOString()]
    );

    const row = result.rows[0] || {};
    res.json({
      visitors: Number(row.visitors || 0),
      portfolio_interest: Number(row.portfolio_interest || 0),
      pricing_interest: Number(row.pricing_interest || 0),
      whatsapp: Number(row.whatsapp || 0),
      booking: Number(row.booking || 0),
      checkout: Number(row.checkout || 0),
    });
  } catch (err) {
    console.error('admin analytics funnel error', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/admin/analytics/top-pages', requireAdminAuth, async (req, res) => {
  const { from, to } = getAnalyticsDateRange(req);
  const limitRaw = Number(req.query.limit || 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(50, Math.floor(limitRaw)))
    : 10;

  try {
    const result = await pool.query(
      `SELECT
         COALESCE(NULLIF(page_url, ''), '/') AS page,
         COUNT(*)::int AS views,
         COUNT(DISTINCT NULLIF(session_id, ''))::int AS unique_visitors
       FROM events
       WHERE created_at >= $1
         AND created_at <= $2
         AND event_name = 'page_view'
       GROUP BY page
       ORDER BY views DESC
       LIMIT $3`,
      [from.toISOString(), to.toISOString(), limit]
    );

    res.json(Array.isArray(result.rows) ? result.rows : []);
  } catch (err) {
    console.error('admin analytics top-pages error', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/admin/analytics/whatsapp-by-page', requireAdminAuth, async (req, res) => {
  const { from, to } = getAnalyticsDateRange(req);
  const limitRaw = Number(req.query.limit || 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(50, Math.floor(limitRaw)))
    : 10;

  try {
    const result = await pool.query(
      `SELECT
         COALESCE(NULLIF(page_url, ''), '(unknown)') AS page,
         COUNT(*)::int AS whatsapp_clicks,
         COUNT(DISTINCT NULLIF(session_id, ''))::int AS unique_sessions
       FROM events
       WHERE created_at >= $1
         AND created_at <= $2
         AND event_name = 'whatsapp_click'
       GROUP BY page
       ORDER BY whatsapp_clicks DESC
       LIMIT $3`,
      [from.toISOString(), to.toISOString(), limit]
    );

    res.json(Array.isArray(result.rows) ? result.rows : []);
  } catch (err) {
    console.error('admin analytics whatsapp-by-page error', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/admin/analytics/top-event-types', requireAdminAuth, async (req, res) => {
  const { from, to } = getAnalyticsDateRange(req);
  const limitRaw = Number(req.query.limit || 8);
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(20, Math.floor(limitRaw)))
    : 8;

  try {
    const result = await pool.query(
      `SELECT event_name, COUNT(*)::int AS count
       FROM events
       WHERE created_at >= $1
         AND created_at <= $2
         AND event_name <> 'page_view'
         AND event_name NOT LIKE 'debug_%'
       GROUP BY event_name
       ORDER BY count DESC
       LIMIT $3`,
      [from.toISOString(), to.toISOString(), limit]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('admin analytics top-event-types error', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/admin/analytics/page-views', requireAdminAuth, async (req, res) => {
  const { from, to } = getAnalyticsDateRange(req);

  try {
    const result = await pool.query(
      `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
              COUNT(*)::int AS views
       FROM events
       WHERE created_at >= $1
         AND created_at <= $2
         AND event_name = 'page_view'
       GROUP BY date_trunc('day', created_at)
       ORDER BY date_trunc('day', created_at) ASC`,
      [from.toISOString(), to.toISOString()]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('admin analytics page-views error', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/admin/analytics/kpi-compare', requireAdminAuth, async (req, res) => {
  const { from, to } = getAnalyticsDateRange(req);
  const previousRange = getPreviousAnalyticsDateRange(from, to);

  try {
    const [currentResult, previousResult] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int AS total_events,
           COUNT(*) FILTER (WHERE event_name = 'page_view')::int AS page_views,
           COUNT(*) FILTER (WHERE event_name <> 'page_view' AND event_name NOT LIKE 'debug_%')::int AS click_events
         FROM events
         WHERE created_at >= $1
           AND created_at <= $2`,
        [from.toISOString(), to.toISOString()]
      ),
      pool.query(
        `SELECT
           COUNT(*)::int AS total_events,
           COUNT(*) FILTER (WHERE event_name = 'page_view')::int AS page_views,
           COUNT(*) FILTER (WHERE event_name <> 'page_view' AND event_name NOT LIKE 'debug_%')::int AS click_events
         FROM events
         WHERE created_at >= $1
           AND created_at <= $2`,
        [previousRange.from.toISOString(), previousRange.to.toISOString()]
      ),
    ]);

    const current = currentResult.rows[0] || { total_events: 0, page_views: 0, click_events: 0 };
    const previous = previousResult.rows[0] || { total_events: 0, page_views: 0, click_events: 0 };

    res.json({
      current: {
        total_events: Number(current.total_events || 0),
        page_views: Number(current.page_views || 0),
        click_events: Number(current.click_events || 0),
      },
      previous: {
        total_events: Number(previous.total_events || 0),
        page_views: Number(previous.page_views || 0),
        click_events: Number(previous.click_events || 0),
      },
    });
  } catch (err) {
    console.error('admin analytics kpi-compare error', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/admin/analytics/cta-performance', requireAdminAuth, async (req, res) => {
  const { from, to } = getAnalyticsDateRange(req);
  const previousRange = getPreviousAnalyticsDateRange(from, to);
  const limitRaw = Number(req.query.limit || 20);
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(100, Math.floor(limitRaw)))
    : 20;

  try {
    const result = await pool.query(
      `WITH current_clicks AS (
         SELECT
           event_name,
           COALESCE(NULLIF(label, ''), '(no label)') AS label,
           COUNT(*)::int AS clicks,
           COUNT(DISTINCT NULLIF(session_id, ''))::int AS unique_sessions
         FROM events
         WHERE created_at >= $1
           AND created_at <= $2
           AND event_name <> 'page_view'
           AND event_name NOT LIKE 'debug_%'
         GROUP BY event_name, label
       ),
       previous_clicks AS (
         SELECT
           event_name,
           COALESCE(NULLIF(label, ''), '(no label)') AS label,
           COUNT(*)::int AS previous_clicks
         FROM events
         WHERE created_at >= $3
           AND created_at <= $4
           AND event_name <> 'page_view'
           AND event_name NOT LIKE 'debug_%'
         GROUP BY event_name, label
       )
       SELECT
         c.event_name,
         c.label,
         c.clicks,
         c.unique_sessions,
         COALESCE(p.previous_clicks, 0)::int AS previous_clicks,
         COALESCE(SUM(c.clicks) OVER (), 0)::int AS total_clicks
       FROM current_clicks c
       LEFT JOIN previous_clicks p ON p.event_name = c.event_name AND p.label = c.label
       ORDER BY c.clicks DESC, c.event_name ASC, c.label ASC
       LIMIT $5`,
      [
        from.toISOString(),
        to.toISOString(),
        previousRange.from.toISOString(),
        previousRange.to.toISOString(),
        limit,
      ]
    );

    res.json(Array.isArray(result.rows) ? result.rows : []);
  } catch (err) {
    console.error('admin analytics cta-performance error', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/admin/analytics/event-mix', requireAdminAuth, async (req, res) => {
  const { from, to } = getAnalyticsDateRange(req);

  try {
    const result = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE event_name = 'page_view')::int AS page_views,
         COUNT(*) FILTER (WHERE event_name <> 'page_view' AND event_name NOT LIKE 'debug_%')::int AS click_events
       FROM events
       WHERE created_at >= $1
         AND created_at <= $2`,
      [from.toISOString(), to.toISOString()]
    );

    const row = result.rows[0] || { total: 0, page_views: 0, click_events: 0 };
    res.json({
      total: Number(row.total || 0),
      page_views: Number(row.page_views || 0),
      click_events: Number(row.click_events || 0),
    });
  } catch (err) {
    console.error('admin analytics event-mix error', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/admin/analytics/click-trend', requireAdminAuth, async (req, res) => {
  const { from, to } = getAnalyticsDateRange(req);

  try {
    const result = await pool.query(
      `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
              COUNT(*)::int AS clicks
       FROM events
       WHERE created_at >= $1
         AND created_at <= $2
         AND event_name <> 'page_view'
         AND event_name NOT LIKE 'debug_%'
       GROUP BY date_trunc('day', created_at)
       ORDER BY date_trunc('day', created_at) ASC`,
      [from.toISOString(), to.toISOString()]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('admin analytics click-trend error', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/admin/analytics/device-breakdown', requireAdminAuth, async (req, res) => {
  const { from, to } = getAnalyticsDateRange(req);

  try {
    const result = await pool.query(
      `SELECT COALESCE(NULLIF(device_type, ''), 'unknown') AS device_type,
              COUNT(*)::int AS count
       FROM events
       WHERE created_at >= $1
         AND created_at <= $2
       GROUP BY device_type
       ORDER BY count DESC`,
      [from.toISOString(), to.toISOString()]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('admin analytics device-breakdown error', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('/admin/analytics/recent', requireAdminAuth, async (req, res) => {
  const { from, to } = getAnalyticsDateRange(req);
  const pageRaw = Number(req.query.page || 1);
  const pageSizeRaw = Number(req.query.pageSize || DEFAULT_ANALYTICS_PAGE_SIZE);
  const eventTypeRaw = typeof req.query.eventType === 'string' ? req.query.eventType.trim().toLowerCase() : 'all';
  const eventType = ['all', 'page_view', 'clicks'].includes(eventTypeRaw) ? eventTypeRaw : 'all';
  const page = Number.isFinite(pageRaw) ? Math.max(1, Math.floor(pageRaw)) : 1;
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.max(1, Math.min(MAX_ANALYTICS_PAGE_SIZE, Math.floor(pageSizeRaw)))
    : DEFAULT_ANALYTICS_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  const whereClauses = [
    'created_at >= $1',
    'created_at <= $2',
  ];
  const params = [from.toISOString(), to.toISOString()];

  if (eventType === 'page_view') {
    whereClauses.push("event_name = 'page_view'");
  } else if (eventType === 'clicks') {
    whereClauses.push("event_name <> 'page_view'");
  }

  const whereSql = whereClauses.join(' AND ');
  const limitParamIndex = params.length + 1;
  const offsetParamIndex = params.length + 2;

  try {
    const [rowsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT id, event_name, label, page_url, session_id, referrer, device_type, created_at
         FROM events
         WHERE ${whereSql}
         ORDER BY created_at DESC
         LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
        [...params, pageSize, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM events
         WHERE ${whereSql}`,
        params
      )
    ]);

    const total = countResult.rows[0]?.total || 0;

    res.json({
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      rows: rowsResult.rows,
    });
  } catch (err) {
    console.error('admin analytics recent error', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
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
    const result = await pool.query('DELETE FROM portfolio_images WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Portfolio image not found' });
    }

    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Delete underlying library asset by portfolio image id (global)
app.delete('/portfolio-images/:id/library-asset', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const imageResult = await client.query(
      'SELECT url FROM portfolio_images WHERE id = $1 LIMIT 1',
      [id]
    );

    if (imageResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Portfolio image not found' });
    }

    const imageUrl = imageResult.rows[0].url;

    const removedAssets = await client.query(
      'DELETE FROM assets WHERE url = $1 RETURNING id',
      [imageUrl]
    );

    const removedPortfolioLinks = await client.query(
      'DELETE FROM portfolio_images WHERE url = $1 RETURNING id',
      [imageUrl]
    );

    const clearedCovers = await client.query(
      'UPDATE portfolios SET cover_image_url = NULL WHERE cover_image_url = $1 RETURNING id',
      [imageUrl]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Asset deleted from library and removed from portfolios',
      removedAssets: removedAssets.rowCount,
      removedPortfolioLinks: removedPortfolioLinks.rowCount,
      clearedPortfolioCovers: clearedCovers.rowCount,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to delete library asset' });
  } finally {
    client.release();
  }
});

// --- Media Library (Folders & Assets) ---

// Get all folders
app.get('/folders', requireAdminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM folders ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Create folder
app.post('/folders', requireAdminAuth, async (req, res) => {
  const { name, parent_id, public_slug } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  const client = await pool.connect();
  try {
    const finalSlug = await ensureUniqueFolderPublicSlug(client, public_slug || name);
    const result = await client.query(
      'INSERT INTO folders (name, parent_id, public_slug) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), parent_id || null, finalSlug]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create folder' });
  } finally {
    client.release();
  }
});

// Update folder (e.g., set cover image)
app.patch('/folders/:id', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { cover_image_url, name, is_public, public_slug } = req.body;
  
  const client = await pool.connect();
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
    if (is_public !== undefined) {
      query += `is_public = $${count}, `;
      params.push(Boolean(is_public));
      count++;
    }
    if (public_slug !== undefined) {
      const normalized = normalizePublicFolderSlug(public_slug);
      const finalSlug = normalized
        ? await ensureUniqueFolderPublicSlug(client, normalized, id)
        : await ensureUniqueFolderPublicSlug(client, name || 'gallery', id);
      query += `public_slug = $${count}, `;
      params.push(finalSlug);
      count++;
    }

    if (params.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Remove trailing comma and space
    query = query.slice(0, -2);
    query += ` WHERE id = $${count} RETURNING *`;
    params.push(id);

    const result = await client.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update folder' });
  } finally {
    client.release();
  }
});

// Get assets (optionally filtered by folder) with pagination
app.get('/assets', requireAdminAuth, async (req, res) => {
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

// Public folders list (safe fields only)
app.get('/public/folders', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, parent_id, cover_image_url, is_public, public_slug
       FROM folders
       WHERE COALESCE(is_public, true) = true
       ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch public folders' });
  }
});

// Public assets list (filtered to public assets/folders)
app.get('/public/assets', async (req, res) => {
  const folderId = typeof req.query.folder_id === 'string' ? req.query.folder_id : null;
  const pageNum = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? '20'), 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  try {
    const params = [];
    let whereClause = `
      WHERE COALESCE(a.is_public, true) = true
        AND (a.folder_id IS NULL OR EXISTS (
          SELECT 1 FROM folders f
          WHERE f.id = a.folder_id
            AND COALESCE(f.is_public, true) = true
        ))
    `;

    if (folderId) {
      params.push(folderId);
      whereClause += ` AND a.folder_id = $${params.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM assets a ${whereClause}`,
      params
    );
    const totalCount = parseInt(countResult.rows[0].count, 10) || 0;

    params.push(limitNum, offset);
    const assetsQuery = `
      SELECT a.id, a.url, a.folder_id, a.created_at
      FROM assets a
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const assetsResult = await pool.query(assetsQuery, params);

    res.json({
      assets: assetsResult.rows,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch public assets' });
  }
});

app.get('/public/gallery/:slug/assets', async (req, res) => {
  const requestedSlug = normalizePublicFolderSlug(req.params.slug || '');
  const pageNum = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? '20'), 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  if (!requestedSlug) {
    return res.status(400).json({ error: 'Invalid gallery slug' });
  }

  try {
    const folderResult = await pool.query(
      `SELECT id, name, parent_id, cover_image_url, is_public, public_slug
       FROM folders
       WHERE public_slug = $1
         AND COALESCE(is_public, true) = true
       LIMIT 1`,
      [requestedSlug]
    );

    if (folderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Gallery not found' });
    }

    const folder = folderResult.rows[0];
    const countResult = await pool.query(
      `SELECT COUNT(*)
       FROM assets a
       WHERE a.folder_id = $1
         AND COALESCE(a.is_public, true) = true`,
      [folder.id]
    );
    const totalCount = parseInt(countResult.rows[0].count, 10) || 0;

    const assetsResult = await pool.query(
      `SELECT id, url, folder_id, created_at
       FROM assets
       WHERE folder_id = $1
         AND COALESCE(is_public, true) = true
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [folder.id, limitNum, offset]
    );

    res.json({
      folder,
      assets: assetsResult.rows,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
      currentPage: pageNum,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch gallery assets' });
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
      'UPDATE assets SET folder_id = $1 WHERE id = ANY($2::uuid[]) AND folder_id IS DISTINCT FROM $1 RETURNING *',
      [folder_id, assetIds]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No images needed moving (already in destination or not found)' });
    }

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
    const result = await pool.query('DELETE FROM assets WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

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

let blogSortOrderSupported = true;

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
  const { category } = req.query;
  const pageNum = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limitNum = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? '9'), 10) || 9));
  const offset = (pageNum - 1) * limitNum;

  const buildBaseQuery = (includeSortOrder) => {
    const orderClause = includeSortOrder
      ? 'ORDER BY p.sort_order ASC, p.published_at DESC, p.created_at DESC'
      : 'ORDER BY p.published_at DESC, p.created_at DESC';

    return `
      SELECT p.*, 
        COALESCE(
          json_agg(json_build_object('id', c.id, 'name', c.name, 'slug', c.slug))
          FILTER (WHERE c.id IS NOT NULL), '[]'
        ) AS categories
      FROM blog_posts p
      LEFT JOIN blog_post_categories pc ON pc.post_id = p.id
      LEFT JOIN blog_categories c ON c.id = pc.category_id
      WHERE p.status = 'published'
      {{CATEGORY_FILTER}}
      GROUP BY p.id
      ${orderClause}
    `;
  };

  const runPostsQuery = async (includeSortOrder) => {
    let baseQuery = buildBaseQuery(includeSortOrder);
    const params = [];

    if (category) {
      params.push(category);
      baseQuery = baseQuery.replace('{{CATEGORY_FILTER}}', ` AND EXISTS (
        SELECT 1 FROM blog_post_categories pc2
        JOIN blog_categories c2 ON c2.id = pc2.category_id
        WHERE pc2.post_id = p.id AND c2.slug = $${params.length}
      )`);
    } else {
      baseQuery = baseQuery.replace('{{CATEGORY_FILTER}}', '');
    }

    params.push(limitNum, offset);
    return pool.query(
      `${baseQuery} LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
  };

  try {
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

    let result;
    try {
      result = await runPostsQuery(blogSortOrderSupported);
    } catch (err) {
      if (blogSortOrderSupported && err && err.code === '42703' && /sort_order/i.test(String(err.message || ''))) {
        blogSortOrderSupported = false;
        console.warn('blog_posts.sort_order is unavailable; falling back to published_at ordering for /blog-posts');
        result = await runPostsQuery(false);
      } else {
        throw err;
      }
    }

    res.json({
      posts: result.rows.map(sanitizeBlogPostForPublic),
      totalCount: total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum
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

    const buildRelatedQuery = (includeSortOrder) => `SELECT p.*, 
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
       ORDER BY shared_count DESC, ${includeSortOrder ? 'p.sort_order ASC, ' : ''}p.published_at DESC, p.created_at DESC
       LIMIT $2`;

    let related;
    try {
      related = await pool.query(buildRelatedQuery(blogSortOrderSupported), [sourceId, limit]);
    } catch (err) {
      if (blogSortOrderSupported && err && err.code === '42703' && /sort_order/i.test(String(err.message || ''))) {
        blogSortOrderSupported = false;
        console.warn('blog_posts.sort_order is unavailable; falling back to published_at ordering for /blog-posts/:slug/related');
        related = await pool.query(buildRelatedQuery(false), [sourceId, limit]);
      } else {
        throw err;
      }
    }

    res.json(related.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch related posts' });
  }
});

// GET /blog-posts/all — ALL posts including drafts (admin)
app.get('/blog-posts/all', requireAdminAuth, async (req, res) => {
  try {
    const buildAllPostsQuery = (includeSortOrder) => `
      SELECT p.*,
        COALESCE(
          json_agg(json_build_object('id', c.id, 'name', c.name, 'slug', c.slug))
          FILTER (WHERE c.id IS NOT NULL), '[]'
        ) AS categories
      FROM blog_posts p
      LEFT JOIN blog_post_categories pc ON pc.post_id = p.id
      LEFT JOIN blog_categories c ON c.id = pc.category_id
      GROUP BY p.id
      ORDER BY ${includeSortOrder ? 'p.sort_order ASC, ' : ''}p.created_at DESC
    `;

    let result;
    try {
      result = await pool.query(buildAllPostsQuery(blogSortOrderSupported));
    } catch (err) {
      if (blogSortOrderSupported && err && err.code === '42703' && /sort_order/i.test(String(err.message || ''))) {
        blogSortOrderSupported = false;
        console.warn('blog_posts.sort_order is unavailable; falling back to created_at ordering for /blog-posts/all');
        result = await pool.query(buildAllPostsQuery(false));
      } else {
        throw err;
      }
    }

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
  const safeContent = sanitizeRichText(normalizeRichTextInput(content));
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
  const safeContent = sanitizeRichText(normalizeRichTextInput(content));
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
    const buildRecentQuery = (includeSortOrder) =>
      `SELECT id, title, slug, cover_image_url, published_at FROM blog_posts
       WHERE status='published' ORDER BY ${includeSortOrder ? 'sort_order ASC, ' : ''}published_at DESC, created_at DESC LIMIT 5`;

    let result;
    try {
      result = await pool.query(buildRecentQuery(blogSortOrderSupported));
    } catch (err) {
      if (blogSortOrderSupported && err && err.code === '42703' && /sort_order/i.test(String(err.message || ''))) {
        blogSortOrderSupported = false;
        console.warn('blog_posts.sort_order is unavailable; falling back to published_at ordering for /blog-posts-recent');
        result = await pool.query(buildRecentQuery(false));
      } else {
        throw err;
      }
    }

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

// POST /contact-enquiries — submit booking interest from Contact page
app.post('/contact-enquiries', contactLimiter, async (req, res) => {
  const fullName = sanitizePlainText(req.body?.full_name, 120);
  const phone = sanitizePlainText(req.body?.phone, 50);
  const email = sanitizePlainText(req.body?.email, 160);
  const preferredDate = sanitizePlainText(req.body?.preferred_date, 40);
  const packageInterest = sanitizePlainText(req.body?.package_interest, 120);
  const message = sanitizePlainText(req.body?.message, 2000);

  if (!fullName || !phone || !email || !preferredDate || !packageInterest) {
    return res.status(400).json({ error: 'Missing required enquiry details' });
  }

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailLooksValid) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({ error: 'Email service is not configured on this server' });
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

  const submittedAtIso = new Date().toISOString();
  const brandColors = {
    skyBlue: '#6EC1E4',
    magenta: '#B84FA0',
    cream: '#F9F5F2',
    dark: '#1C1C1C',
    slate: '#475467',
    line: '#E5E7EB',
  };

  const adminText = [
    'Fiesta House Maternity - New Contact & Booking Enquiry',
    '',
    `Name: ${fullName}`,
    `Phone: ${phone}`,
    `Email: ${email}`,
    `Preferred Date: ${preferredDate}`,
    `Package: ${packageInterest}`,
    `Message: ${message || '(none)'}`,
    '',
    `Submitted At: ${submittedAtIso}`,
  ].join('\n');

  const adminHtml = `
    <div style="margin:0; padding:0; background:#ffffff; font-family:Arial,Helvetica,sans-serif; color:${brandColors.dark};">
      <div style="max-width:760px; margin:0 auto; border-top:8px solid ${brandColors.magenta};">
        <div style="padding:14px 24px; background:#ffffff; border-bottom:1px solid ${brandColors.line};">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td style="font-size:22px; font-weight:700; letter-spacing:0.02em; color:${brandColors.dark}; font-family:Georgia, 'Times New Roman', serif;">Fiesta House Maternity</td>
              <td style="text-align:right; font-size:12px; color:${brandColors.slate};">Nairobi, Kenya</td>
            </tr>
          </table>
        </div>

        <div style="padding:28px 24px 20px; background:linear-gradient(135deg, ${brandColors.skyBlue} 0%, ${brandColors.magenta} 100%);">
          <div style="color:#ffffff; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; font-weight:700; opacity:0.95;">Contact & Booking</div>
          <h1 style="margin:8px 0 4px; color:#ffffff; font-size:30px; line-height:1.2; font-family:Georgia, 'Times New Roman', serif;">New Enquiry Received</h1>
          <p style="margin:0; color:rgba(255,255,255,0.92); font-size:14px;">A new lead came in from the Contact page.</p>
        </div>

        <div style="padding:22px 24px; border-bottom:1px solid ${brandColors.line}; background:#ffffff;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td style="padding:0 0 12px; border-bottom:1px solid ${brandColors.line}; width:180px; color:${brandColors.slate}; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; font-weight:700;">Full Name</td>
              <td style="padding:0 0 12px; border-bottom:1px solid ${brandColors.line}; font-size:15px; font-weight:600;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding:12px 0; border-bottom:1px solid ${brandColors.line}; color:${brandColors.slate}; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; font-weight:700;">Phone</td>
              <td style="padding:12px 0; border-bottom:1px solid ${brandColors.line}; font-size:15px; font-weight:600;">${phone}</td>
            </tr>
            <tr>
              <td style="padding:12px 0; border-bottom:1px solid ${brandColors.line}; color:${brandColors.slate}; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; font-weight:700;">Email</td>
              <td style="padding:12px 0; border-bottom:1px solid ${brandColors.line}; font-size:15px; font-weight:600;">
                <a href="mailto:${email}" style="color:${brandColors.magenta}; text-decoration:none;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0; border-bottom:1px solid ${brandColors.line}; color:${brandColors.slate}; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; font-weight:700;">Preferred Date</td>
              <td style="padding:12px 0; border-bottom:1px solid ${brandColors.line}; font-size:15px; font-weight:600;">${preferredDate}</td>
            </tr>
            <tr>
              <td style="padding:12px 0 0; color:${brandColors.slate}; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; font-weight:700;">Package</td>
              <td style="padding:12px 0 0; font-size:15px; font-weight:600;">${packageInterest}</td>
            </tr>
          </table>
        </div>

        <div style="padding:20px 24px; background:${brandColors.cream}; border-bottom:1px solid ${brandColors.line};">
          <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:${brandColors.slate}; font-weight:700; margin-bottom:10px;">Client Message</div>
          <div style="padding:0; font-size:14px; line-height:1.8; color:${brandColors.dark}; white-space:pre-wrap;">${message || '(none)'}</div>
        </div>

        <div style="padding:18px 24px 24px; background:#ffffff;">
          <a href="tel:${phone}" style="display:inline-block; padding:10px 16px; border-radius:999px; background:${brandColors.skyBlue}; color:#fff; text-decoration:none; font-weight:700; margin-right:8px;">Call Client</a>
          <a href="mailto:${email}" style="display:inline-block; padding:10px 16px; border-radius:999px; background:${brandColors.magenta}; color:#fff; text-decoration:none; font-weight:700;">Reply by Email</a>
          <p style="margin:14px 0 0; font-size:12px; color:#98A2B3;">Submitted at ${submittedAtIso}</p>
        </div>

        <div style="padding:20px 24px 24px; background:${brandColors.cream}; border-top:1px solid ${brandColors.line};">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td style="font-size:13px; line-height:1.7; color:${brandColors.slate};">
                Diamond Plaza, 4th Avenue Parklands, Nairobi County, Kenya
                <br />
                <a href="mailto:info@fiestahouseattire.com" style="color:${brandColors.magenta}; text-decoration:none;">info@fiestahouseattire.com</a>
                &nbsp;|&nbsp;
                <a href="https://www.fiestahousematernity.com" style="color:${brandColors.magenta}; text-decoration:none;">www.fiestahousematernity.com</a>
              </td>
              <td style="text-align:right; vertical-align:top; font-size:12px; color:#98A2B3; white-space:nowrap;">
                Fiesta House Maternity
                <br />
                Contact Team
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: '"Fiesta House Contact" <' + process.env.SMTP_USER + '>',
      to: CONTACT_TEST_RECIPIENT,
      subject: `Contact Enquiry: ${fullName}`,
      text: adminText,
      html: adminHtml
    });

    res.json({ success: true, routedTo: CONTACT_TEST_RECIPIENT });
  } catch (err) {
    console.error('contact enquiry email error', err);
    res.status(500).json({ error: 'Failed to send enquiry email' });
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
      <h1 style="color: white; margin: 0; font-family: serif; font-style: italic; font-size: 28px; letter-spacing: 1px;">Fiesta House Maternity</h1>
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
        &copy; 2026 Fiesta House Maternity. Diamond Plaza, Nairobi. All rights reserved.
      </div>
    </div>
  `;

  // Send to Admin
  await transporter.sendMail({
    from: '"Fiesta House Shop Maternity" <' + process.env.SMTP_USER + '>',
    to: 'info@fiestahouseattire.com', // Admin email
    subject: `New Shop Order: ${order.customer_name}`,
    html: adminEmailContent
  });

  // Send to Customer
  await transporter.sendMail({
    from: '"Fiesta House Maternity" <' + process.env.SMTP_USER + '>',
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

const normalizeSiteUrl = (value) => {
  const fallback = 'https://www.fiestahousematernity.com';
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return fallback;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return fallback;
  }
};

const SITEMAP_SITE_URL = normalizeSiteUrl(process.env.SITE_URL);
const MATERNITY_GOWNS_FOLDER_ID = 'b8b100e9-81ce-4778-bf57-0adee0b46fc0';
const IMAGE_SITEMAP_FALLBACK_IMAGE = `${SITEMAP_SITE_URL}/og-image.jpg`;

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/portfolio', priority: '0.8', changefreq: 'weekly' },
  { path: '/maternity-gowns', priority: '0.8', changefreq: 'weekly' },
  { path: '/pricing', priority: '0.8', changefreq: 'monthly' },
  { path: '/blog', priority: '0.8', changefreq: 'weekly' },
  { path: '/videos', priority: '0.8', changefreq: 'weekly' },
  { path: '/experience', priority: '0.7', changefreq: 'monthly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/shop', priority: '0.6', changefreq: 'weekly' },
];

// Known static images always seeded into the image sitemap so it is never empty.
// These are hardcoded public URLs that exist in Supabase storage.
const STATIC_IMAGE_SEEDS = [
  { page: '/', url: `${SITEMAP_SITE_URL}/og-image.jpg` },
  { page: '/maternity-gowns', url: 'https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887595087_IMGL5485-scaled.jpg' },
  { page: '/', url: 'https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886589981_IMGL4288.jpg' },
  { page: '/', url: 'https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777886936832_IMG_4849-scaled.jpg' },
  { page: '/portfolio', url: 'https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887598545_IMG_5166-scaled.jpg' },
  { page: '/portfolio', url: 'https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887597410_IMG_5033-scaled.jpg' },
  { page: '/portfolio', url: 'https://silreoobmqwxbloiznyo.supabase.co/storage/v1/object/public/assets/1777887596251_IMG_0053-1365x2048.jpg' },
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
        `  <url>\n    <loc>${SITEMAP_SITE_URL}${r.path === '/' ? '/' : r.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`
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
        `  <url>\n    <loc>${SITEMAP_SITE_URL}/portfolio/${xmlEscape(p.slug)}</loc>\n    <lastmod>${isoDate(p.lastmod)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`
      );
    }

    for (const p of posts.rows) {
      urls.push(
        `  <url>\n    <loc>${SITEMAP_SITE_URL}/blog/${xmlEscape(p.slug)}</loc>\n    <lastmod>${isoDate(p.lastmod)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`
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
    const [portfolioImages, portfolioCovers, blogCovers, gownAssets, publicGalleryAssets, allPublicAssets] = await Promise.all([
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
      pool.query(
        `SELECT f.public_slug AS slug, a.url
         FROM assets a
         JOIN folders f ON f.id = a.folder_id
         WHERE a.url IS NOT NULL
           AND TRIM(a.url) <> ''
           AND f.public_slug IS NOT NULL
           AND TRIM(f.public_slug) <> ''
           AND COALESCE(f.is_public, TRUE) = TRUE
           AND COALESCE(a.is_public, TRUE) = TRUE
         ORDER BY a.created_at DESC`
      ),
      // Broad fallback: grab any publicly accessible asset URLs
      pool.query(
        `SELECT a.url
         FROM assets a
         WHERE a.url IS NOT NULL
           AND TRIM(a.url) <> ''
           AND COALESCE(a.is_public, TRUE) = TRUE
         ORDER BY a.created_at DESC
         LIMIT 200`
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

    // Always seed known-good static images so the sitemap is never empty
    for (const seed of STATIC_IMAGE_SEEDS) {
      addImage(seed.page, seed.url);
    }

    for (const row of portfolioImages.rows) {
      if (!row.slug) continue;
      addImage(`/portfolio/${row.slug}`, row.url);
      // Also associate portfolio images with the main portfolio listing page
      addImage('/portfolio', row.url);
    }

    for (const row of portfolioCovers.rows) {
      if (!row.slug) continue;
      addImage(`/portfolio/${row.slug}`, row.url);
      addImage('/portfolio', row.url);
    }

    for (const row of blogCovers.rows) {
      if (!row.slug) continue;
      addImage(`/blog/${row.slug}`, row.url);
    }

    for (const row of gownAssets.rows) {
      addImage('/maternity-gowns', row.url);
    }

    for (const row of publicGalleryAssets.rows) {
      if (!row.slug) continue;
      addImage(`/gallery/${row.slug}`, row.url);
    }

    // Broad fallback: if portfolio/gown queries returned nothing, spread public assets
    // across homepage and portfolio so crawlers still find real photography content
    if (allPublicAssets.rows.length > 0) {
      const portfolioHasImages = [...byPage.keys()].some(k => k.startsWith('/portfolio'));
      if (!portfolioHasImages) {
        allPublicAssets.rows.forEach((row, idx) => {
          // Alternate between / and /portfolio so images are discoverable
          addImage(idx % 2 === 0 ? '/' : '/portfolio', row.url);
        });
      }
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

