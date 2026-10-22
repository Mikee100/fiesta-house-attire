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

function isSupabaseImageUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (
      url.hostname.endsWith(".supabase.co") &&
      url.pathname.includes("/storage/v1/object/public/assets/")
    );
  } catch {
    return false;
  }
}

async function main() {
  const mapPath = path.join(__dirname, "cloudinary-migration-map.json");
  const raw = JSON.parse(fs.readFileSync(mapPath, "utf8"));

  const mapping =
    raw.mappings ||
    raw.mapping ||
    raw.urlMap ||
    raw;

  if (!mapping || typeof mapping !== "object") {
    throw new Error("Could not read the Cloudinary mapping file.");
  }

  const entries = Object.entries(mapping).filter(
    ([source, target]) =>
      typeof source === "string" &&
      typeof target === "string" &&
      isSupabaseImageUrl(source) &&
      target.includes("res.cloudinary.com/")
  );

  const urlMap = new Map(entries);

  if (urlMap.size !== 746) {
    throw new Error(
      `Expected 746 mapping entries, found ${urlMap.size}. ` +
      "No database changes were made."
    );
  }

  let totalRows = 0;
  let mappedReferences = 0;
  let missingMappings = 0;
  let alreadyCloudinary = 0;
  const missingUrls = new Set();
  const report = [];

  for (const { table, column } of tables) {
    const result = await pool.query(
      `SELECT id, "${column}" AS image_url
       FROM public."${table}"`
    );

    let tableMapped = 0;
    let tableMissing = 0;
    let tableCloudinary = 0;
    let tableSupabase = 0;

    for (const row of result.rows) {
      totalRows++;

      if (urlMap.has(row.image_url)) {
        tableMapped++;
        mappedReferences++;
      } else if (isSupabaseImageUrl(row.image_url)) {
        tableMissing++;
        missingMappings++;
        tableSupabase++;
        missingUrls.add(row.image_url);
      } else if (
        typeof row.image_url === "string" &&
        row.image_url.includes("res.cloudinary.com/")
      ) {
        tableCloudinary++;
        alreadyCloudinary++;
      }
    }

    report.push({
      table,
      rows_inspected: result.rows.length,
      references_with_mapping: tableMapped,
      supabase_urls_missing_mapping: tableMissing,
      already_cloudinary: tableCloudinary
    });
  }

  console.table(report);
  console.log("\n--- DRY-RUN SUMMARY ---");
  console.log("Mapping entries validated:", urlMap.size);
  console.log("Rows inspected:", totalRows);
  console.log("References ready to replace:", mappedReferences);
  console.log("Already Cloudinary:", alreadyCloudinary);
  console.log("Supabase references missing mapping:", missingMappings);
  console.log("Distinct missing Supabase URLs:", missingUrls.size);
  console.log("Database changed: NO");
  console.log("Supabase files deleted: NO");

  if (missingMappings > 0) {
    console.log(
      "\nSTOP: Resolve missing mappings before any database update."
    );
  } else {
    console.log(
      "\nPreflight result: PASS — no unmapped Supabase image references found."
    );
  }
}

main()
  .catch(err => {
    console.error("Dry-run failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
