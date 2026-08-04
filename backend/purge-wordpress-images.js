const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { Pool } = require('pg');

const useSsl = process.env.DATABASE_SSL !== 'false';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

const WORDPRESS_URL_SQL_RE = String.raw`^https?://(www\.)?fiestahouseattire\.com/(new/)?wp-content/uploads/`;

function parseArgs(argv) {
  const args = {
    apply: false,
  };

  for (const arg of argv) {
    if (arg === '--apply') args.apply = true;
  }

  return args;
}

async function tableExists(client, tableName) {
  const result = await client.query('SELECT to_regclass($1) AS reg', [tableName]);
  return Boolean(result.rows[0]?.reg);
}

async function countMatching(client) {
  const counts = {
    portfolio_images_delete: 0,
    assets_delete: 0,
    portfolios_cover_null: 0,
    folders_cover_null: 0,
    blog_posts_cover_null: 0,
    total_changes: 0,
  };

  if (await tableExists(client, 'portfolio_images')) {
    const r = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM portfolio_images
       WHERE url ~* $1`,
      [WORDPRESS_URL_SQL_RE],
    );
    counts.portfolio_images_delete = r.rows[0].count;
  }

  if (await tableExists(client, 'assets')) {
    const r = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM assets
       WHERE url ~* $1`,
      [WORDPRESS_URL_SQL_RE],
    );
    counts.assets_delete = r.rows[0].count;
  }

  if (await tableExists(client, 'portfolios')) {
    const r = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM portfolios
       WHERE cover_image_url ~* $1`,
      [WORDPRESS_URL_SQL_RE],
    );
    counts.portfolios_cover_null = r.rows[0].count;
  }

  if (await tableExists(client, 'folders')) {
    const r = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM folders
       WHERE cover_image_url ~* $1`,
      [WORDPRESS_URL_SQL_RE],
    );
    counts.folders_cover_null = r.rows[0].count;
  }

  if (await tableExists(client, 'blog_posts')) {
    const r = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM blog_posts
       WHERE cover_image_url ~* $1`,
      [WORDPRESS_URL_SQL_RE],
    );
    counts.blog_posts_cover_null = r.rows[0].count;
  }

  counts.total_changes =
    counts.portfolio_images_delete +
    counts.assets_delete +
    counts.portfolios_cover_null +
    counts.folders_cover_null +
    counts.blog_posts_cover_null;

  return counts;
}

async function applyPurge(client) {
  const changed = {
    portfolio_images_delete: 0,
    assets_delete: 0,
    portfolios_cover_null: 0,
    folders_cover_null: 0,
    blog_posts_cover_null: 0,
    total_changes: 0,
  };

  if (await tableExists(client, 'portfolio_images')) {
    const r = await client.query(
      `DELETE FROM portfolio_images
       WHERE url ~* $1`,
      [WORDPRESS_URL_SQL_RE],
    );
    changed.portfolio_images_delete = r.rowCount;
  }

  if (await tableExists(client, 'assets')) {
    const r = await client.query(
      `DELETE FROM assets
       WHERE url ~* $1`,
      [WORDPRESS_URL_SQL_RE],
    );
    changed.assets_delete = r.rowCount;
  }

  if (await tableExists(client, 'portfolios')) {
    const r = await client.query(
      `UPDATE portfolios
       SET cover_image_url = NULL
       WHERE cover_image_url ~* $1`,
      [WORDPRESS_URL_SQL_RE],
    );
    changed.portfolios_cover_null = r.rowCount;
  }

  if (await tableExists(client, 'folders')) {
    const r = await client.query(
      `UPDATE folders
       SET cover_image_url = NULL
       WHERE cover_image_url ~* $1`,
      [WORDPRESS_URL_SQL_RE],
    );
    changed.folders_cover_null = r.rowCount;
  }

  if (await tableExists(client, 'blog_posts')) {
    const r = await client.query(
      `UPDATE blog_posts
       SET cover_image_url = NULL
       WHERE cover_image_url ~* $1`,
      [WORDPRESS_URL_SQL_RE],
    );
    changed.blog_posts_cover_null = r.rowCount;
  }

  changed.total_changes =
    changed.portfolio_images_delete +
    changed.assets_delete +
    changed.portfolios_cover_null +
    changed.folders_cover_null +
    changed.blog_posts_cover_null;

  return changed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.apply ? 'APPLY' : 'DRY-RUN';

  console.log(`\n[wp-image-purge] Mode: ${mode}`);
  console.log('[wp-image-purge] Target regex:', WORDPRESS_URL_SQL_RE);

  const client = await pool.connect();
  try {
    if (!args.apply) {
      const counts = await countMatching(client);
      console.log('\n[wp-image-purge] Potential changes:');
      console.log(`- portfolio_images rows to delete: ${counts.portfolio_images_delete}`);
      console.log(`- assets rows to delete: ${counts.assets_delete}`);
      console.log(`- portfolios.cover_image_url to null: ${counts.portfolios_cover_null}`);
      console.log(`- folders.cover_image_url to null: ${counts.folders_cover_null}`);
      console.log(`- blog_posts.cover_image_url to null: ${counts.blog_posts_cover_null}`);
      console.log(`- total prospective changes: ${counts.total_changes}`);
      console.log('\n[wp-image-purge] No data changed (dry-run).');
      return;
    }

    await client.query('BEGIN');
    const changed = await applyPurge(client);
    await client.query('COMMIT');

    console.log('\n[wp-image-purge] Applied changes:');
    console.log(`- portfolio_images rows deleted: ${changed.portfolio_images_delete}`);
    console.log(`- assets rows deleted: ${changed.assets_delete}`);
    console.log(`- portfolios.cover_image_url nulled: ${changed.portfolios_cover_null}`);
    console.log(`- folders.cover_image_url nulled: ${changed.folders_cover_null}`);
    console.log(`- blog_posts.cover_image_url nulled: ${changed.blog_posts_cover_null}`);
    console.log(`- total changes applied: ${changed.total_changes}`);
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    console.error('\n[wp-image-purge] Failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
