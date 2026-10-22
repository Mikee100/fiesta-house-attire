require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase")
    ? { rejectUnauthorized: false }
    : undefined
});

const tables = [
  { table: "assets", column: "url", expected: 996 },
  { table: "blog_posts", column: "cover_image_url", expected: 31 },
  { table: "folders", column: "cover_image_url", expected: 9 },
  { table: "portfolio_images", column: "url", expected: 406 },
  { table: "portfolios", column: "cover_image_url", expected: 13 }
];

const commitMode = process.argv.includes("--commit");

function isSupabaseAssetUrl(value) {
  try {
    const u = new URL(value);
    return u.hostname.endsWith(".supabase.co") &&
      u.pathname.includes("/storage/v1/object/public/assets/");
  } catch {
    return false;
  }
}

async function main() {
  const mapPath = path.join(__dirname, "cloudinary-migration-map.json");
  const raw = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const mapping = raw.mappings || raw.mapping || raw.urlMap || raw;

  const entries = Object.entries(mapping).filter(
    ([source, target]) =>
      typeof source === "string" &&
      typeof target === "string" &&
      isSupabaseAssetUrl(source) &&
      target.includes("res.cloudinary.com/")
  );

  if (entries.length !== 746) {
    throw new Error(
      `Expected 746 valid mappings; found ${entries.length}.`
    );
  }

  const mapJson = JSON.stringify(
    entries.map(([source, target]) => ({ source, target }))
  );
  const sourceUrls = entries.map(([source]) => source);
  const client = await pool.connect();

  try {
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");

    // Prevent concurrent writes to these tables during this transaction.
    for (const { table } of tables) {
      await client.query(
        `LOCK TABLE public."${table}" IN SHARE ROW EXCLUSIVE MODE`
      );
    }

    const before = [];

    for (const item of tables) {
      const result = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM public."${item.table}"
         WHERE "${item.column}" = ANY($1::text[])`,
        [sourceUrls]
      );

      const count = result.rows[0].count;
      before.push({ ...item, count });

      if (count !== item.expected) {
        throw new Error(
          `${item.table}: expected ${item.expected} matching references, ` +
          `but found ${count}. Transaction will be rolled back.`
        );
      }
    }

    console.log(commitMode ? "MODE: COMMIT" : "MODE: DRY RUN");
    console.log("Validated mapping entries:", entries.length);
    console.log("\nMatching references before update:");
    console.table(before.map(({ table, count }) => ({ table, count })));

    const changes = [];

    for (const item of tables) {
      const result = await client.query(
        `UPDATE public."${item.table}" AS t
         SET "${item.column}" = m.target
         FROM jsonb_to_recordset($1::jsonb)
           AS m(source text, target text)
         WHERE t."${item.column}" = m.source`,
        [mapJson]
      );

      changes.push({
        table: item.table,
        expected: item.expected,
        updated: result.rowCount
      });

      if (result.rowCount !== item.expected) {
        throw new Error(
          `${item.table}: expected ${item.expected} updates, ` +
          `got ${result.rowCount}. Transaction will be rolled back.`
        );
      }
    }

    const remaining = [];

    for (const item of tables) {
      const result = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM public."${item.table}"
         WHERE "${item.column}" = ANY($1::text[])`,
        [sourceUrls]
      );

      remaining.push({
        table: item.table,
        mapped_supabase_urls_remaining: result.rows[0].count
      });

      if (result.rows[0].count !== 0) {
        throw new Error(
          `${item.table} still contains mapped source URLs. ` +
          "Transaction will be rolled back."
        );
      }
    }

    console.log("\nProposed update counts:");
    console.table(changes);
    console.log("\nPost-update validation:");
    console.table(remaining);

    const totalUpdated = changes.reduce((sum, row) => sum + row.updated, 0);

    if (totalUpdated !== 1455) {
      throw new Error(
        `Expected 1455 total updates; got ${totalUpdated}.`
      );
    }

    if (commitMode) {
      await client.query("COMMIT");
      console.log("\nCOMMIT SUCCESSFUL.");
      console.log("Total references updated:", totalUpdated);
    } else {
      await client.query("ROLLBACK");
      console.log("\nDRY RUN PASSED; all proposed changes rolled back.");
      console.log("Database changes persisted: NO");
    }

    console.log("Supabase storage files deleted: NO");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

main()
  .catch(err => {
    console.error("\nMigration stopped:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
