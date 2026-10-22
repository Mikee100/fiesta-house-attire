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
  "assets",
  "blog_posts",
  "folders",
  "portfolio_images",
  "portfolios"
];

async function main() {
  const client = await pool.connect();
  const backup = {
    created_at: new Date().toISOString(),
    purpose: "Full-row backup before Cloudinary URL migration",
    tables: {}
  };

  try {
    await client.query(
      "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY"
    );

    for (const table of tables) {
      const result = await client.query(
        `SELECT * FROM public."${table}" ORDER BY id`
      );

      backup.tables[table] = result.rows;
      console.log(`${table}: ${result.rows.length} rows captured`);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  const filename =
    "cloudinary-full-row-backup-" +
    new Date().toISOString().replace(/[:.]/g, "-") +
    ".json";

  const backupPath = path.join(__dirname, filename);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), {
    encoding: "utf8",
    flag: "wx"
  });

  const saved = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  let valid = true;
  let totalRows = 0;

  for (const table of tables) {
    const expected = backup.tables[table];
    const actual = saved.tables[table];

    if (
      !Array.isArray(actual) ||
      actual.length !== expected.length ||
      JSON.stringify(actual) !== JSON.stringify(expected)
    ) {
      valid = false;
    } else {
      totalRows += actual.length;
    }
  }

  if (!valid) {
    throw new Error("Full-row backup validation failed. Stop here.");
  }

  console.log("\nFull-row backup:", filename);
  console.log("Total rows:", totalRows);
  console.log("File size:", fs.statSync(backupPath).size, "bytes");
  console.log("Backup validation: PASS");
  console.log("Database changed: NO");
}

main()
  .catch(err => {
    console.error("Full-row backup failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
