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
  { table: "assets", column: "url" },
  { table: "blog_posts", column: "cover_image_url" },
  { table: "folders", column: "cover_image_url" },
  { table: "portfolio_images", column: "url" },
  { table: "portfolios", column: "cover_image_url" }
];

async function main() {
  const backup = {
    created_at: new Date().toISOString(),
    purpose: "Pre-Cloudinary image URL migration backup",
    tables: {}
  };

  for (const { table, column } of tables) {
    const result = await pool.query(
      `SELECT id, "${column}" AS image_url
       FROM public."${table}"
       ORDER BY id`
    );

    backup.tables[table] = result.rows;
    console.log(`${table}: ${result.rows.length} rows backed up`);
  }

  const filename =
    "cloudinary-db-image-backup-" +
    new Date().toISOString().replace(/[:.]/g, "-") +
    ".json";

  const backupPath = path.join(__dirname, filename);
  const contents = JSON.stringify(backup, null, 2);

  fs.writeFileSync(backupPath, contents, {
    encoding: "utf8",
    flag: "wx"
  });

  const check = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  let valid = true;

  for (const { table } of tables) {
    if (
      !Array.isArray(check.tables[table]) ||
      check.tables[table].length !== backup.tables[table].length
    ) {
      valid = false;
    }
  }

  if (!valid) {
    throw new Error("Backup validation failed. Do not proceed.");
  }

  console.log("\nBackup file:", filename);
  console.log("File size:", fs.statSync(backupPath).size, "bytes");
  console.log("Backup validation:", "PASS");
  console.log("Database changed: NO");
}

main()
  .catch(err => {
    console.error("Backup failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
