const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const useSsl = process.env.DATABASE_SSL !== 'false';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const WORDPRESS_URL_RE = /^https?:\/\/(?:www\.)?fiestahouseattire\.com\/(?:new\/)?wp-content\/uploads\/(.+)$/i;
const SUPABASE_ASSETS_RE = /^https?:\/\/.+\.supabase\.co\/storage\/v1\/object\/public\/assets\//i;
const REPORT_DIR = path.resolve(__dirname, 'migration-reports');

function parseArgs(argv) {
  const args = {
    apply: false,
    includeAssets: false,
    portfolioId: null,
    limit: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--apply') args.apply = true;
    else if (a === '--include-assets') args.includeAssets = true;
    else if (a === '--portfolio-id') args.portfolioId = argv[i + 1] || null;
    else if (a === '--limit') {
      const n = Number(argv[i + 1]);
      args.limit = Number.isFinite(n) && n > 0 ? n : null;
    }
  }

  return args;
}

function ensureReportDir() {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
}

function safeBaseName(url) {
  try {
    const u = new URL(url);
    const raw = path.basename(u.pathname) || 'image.jpg';
    return raw.replace(/[^a-zA-Z0-9._-]/g, '_');
  } catch {
    return `image-${Date.now()}.jpg`;
  }
}

function isWordPressImageUrl(url) {
  return typeof url === 'string' && WORDPRESS_URL_RE.test(url);
}

async function fetchImageBuffer(url) {
  if (typeof fetch !== 'function') {
    throw new Error('Node fetch API is unavailable. Use Node.js 18+ to run this script.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'User-Agent': 'FiestaHouseMigrationBot/1.0',
      },
      signal: controller.signal,
    });

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} (${contentType || 'unknown content-type'})`);
    }

    if (!contentType.startsWith('image/')) {
      throw new Error(`Expected image content-type, got '${contentType || 'unknown'}'`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function uploadToSupabase({ sourceUrl, buffer, contentType }) {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeBaseName(sourceUrl)}`;
  const objectPath = `migrated/wp/${y}/${m}/${fileName}`;

  const { error } = await supabase.storage
    .from('assets')
    .upload(objectPath, buffer, {
      contentType,
      upsert: false,
      cacheControl: '31536000',
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from('assets').getPublicUrl(objectPath);
  return data.publicUrl;
}

async function getPortfolioImageRows(portfolioId, limit) {
  const params = [];
  const where = [];

  if (portfolioId) {
    params.push(portfolioId);
    where.push(`portfolio_id = $${params.length}`);
  }

  where.push(`url ~* '^https?://(www\\.)?fiestahouseattire\\.com/(new/)?wp-content/uploads/'`);

  let sql = `
    SELECT id, portfolio_id, url
    FROM portfolio_images
    WHERE ${where.join(' AND ')}
    ORDER BY created_at ASC
  `;

  if (limit) {
    params.push(limit);
    sql += ` LIMIT $${params.length}`;
  }

  const result = await pool.query(sql, params);
  return result.rows;
}

async function getAssetRows(limit) {
  const params = [];
  let sql = `
    SELECT id, NULL::uuid AS portfolio_id, url
    FROM assets
    WHERE url ~* '^https?://(www\\.)?fiestahouseattire\\.com/(new/)?wp-content/uploads/'
    ORDER BY created_at ASC
  `;

  if (limit) {
    params.push(limit);
    sql += ` LIMIT $${params.length}`;
  }

  const result = await pool.query(sql, params);
  return result.rows;
}

async function updateRowUrl(table, id, oldUrl, newUrl) {
  const sql = `UPDATE ${table} SET url = $1 WHERE id = $2 AND url = $3`;
  const result = await pool.query(sql, [newUrl, id, oldUrl]);
  return result.rowCount;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();
  const modeLabel = args.apply ? 'APPLY' : 'DRY-RUN';

  console.log(`\n[wp-image-migration] Mode: ${modeLabel}`);
  console.log(`[wp-image-migration] Scope: ${args.portfolioId ? `portfolio ${args.portfolioId}` : 'all portfolios'}`);
  console.log(`[wp-image-migration] Include assets table: ${args.includeAssets ? 'yes' : 'no'}`);

  const report = {
    startedAt,
    mode: modeLabel,
    options: args,
    summary: {
      totalRowsFound: 0,
      attempted: 0,
      migrated: 0,
      skipped: 0,
      failed: 0,
      updatedRows: 0,
    },
    rows: [],
  };

  const urlCache = new Map();

  try {
    const portfolioRows = await getPortfolioImageRows(args.portfolioId, args.limit);
    const assetRows = args.includeAssets ? await getAssetRows(args.limit) : [];
    const allRows = [
      ...portfolioRows.map((r) => ({ ...r, table: 'portfolio_images' })),
      ...assetRows.map((r) => ({ ...r, table: 'assets' })),
    ];

    report.summary.totalRowsFound = allRows.length;
    console.log(`[wp-image-migration] Rows found: ${allRows.length}`);

    for (const row of allRows) {
      const rowReport = {
        id: row.id,
        table: row.table,
        portfolio_id: row.portfolio_id,
        oldUrl: row.url,
        newUrl: null,
        status: 'skipped',
        reason: null,
      };

      if (!isWordPressImageUrl(row.url)) {
        rowReport.reason = 'not_wordpress_url';
        report.summary.skipped += 1;
        report.rows.push(rowReport);
        continue;
      }

      if (SUPABASE_ASSETS_RE.test(row.url)) {
        rowReport.reason = 'already_supabase_url';
        report.summary.skipped += 1;
        report.rows.push(rowReport);
        continue;
      }

      report.summary.attempted += 1;

      try {
        let newUrl = urlCache.get(row.url);
        if (!newUrl) {
          const image = await fetchImageBuffer(row.url);
          newUrl = await uploadToSupabase({
            sourceUrl: row.url,
            buffer: image.buffer,
            contentType: image.contentType,
          });
          urlCache.set(row.url, newUrl);
        }

        rowReport.newUrl = newUrl;

        if (args.apply) {
          const updated = await updateRowUrl(row.table, row.id, row.url, newUrl);
          report.summary.updatedRows += updated;
          if (!updated) {
            rowReport.status = 'failed';
            rowReport.reason = 'row_not_updated_url_changed_or_missing';
            report.summary.failed += 1;
          } else {
            rowReport.status = 'migrated';
            report.summary.migrated += 1;
          }
        } else {
          rowReport.status = 'migrated';
          report.summary.migrated += 1;
        }
      } catch (err) {
        rowReport.status = 'failed';
        rowReport.reason = err instanceof Error ? err.message : String(err);
        report.summary.failed += 1;
      }

      report.rows.push(rowReport);
    }

    ensureReportDir();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(REPORT_DIR, `wp-image-migration-${stamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

    console.log(`\n[wp-image-migration] Done.`);
    console.log(`[wp-image-migration] Attempted: ${report.summary.attempted}`);
    console.log(`[wp-image-migration] Migrated: ${report.summary.migrated}`);
    console.log(`[wp-image-migration] Failed: ${report.summary.failed}`);
    console.log(`[wp-image-migration] Updated rows: ${report.summary.updatedRows}`);
    console.log(`[wp-image-migration] Report: ${reportPath}`);

    if (report.summary.failed > 0) {
      process.exitCode = 2;
    }
  } catch (err) {
    console.error('[wp-image-migration] Fatal error:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
