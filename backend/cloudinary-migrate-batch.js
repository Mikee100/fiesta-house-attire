const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

const cloudinary = require("cloudinary").v2;

const inventoryPath = path.join(__dirname, "cloudinary-migration-inventory.json");
const mapPath = path.join(__dirname, "cloudinary-migration-map.json");
const failedPath = path.join(__dirname, "cloudinary-migration-failed.json");
const BATCH_SIZE = 100;
const FOLDER = "fiesta-house-migrated";

async function main() {
  if (!process.env.CLOUDINARY_URL) {
    throw new Error("CLOUDINARY_URL is missing.");
  }

  if (!fs.existsSync(inventoryPath)) {
    throw new Error("Migration inventory not found.");
  }

  cloudinary.config({ secure: true });

  const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
  const urls = inventory.urls || [];
  const mapping = fs.existsSync(mapPath)
    ? JSON.parse(fs.readFileSync(mapPath, "utf8"))
    : {};
  const failures = fs.existsSync(failedPath)
    ? JSON.parse(fs.readFileSync(failedPath, "utf8"))
    : [];

  const remaining = urls.filter(url => !mapping[url]).slice(0, BATCH_SIZE);

  console.log("Inventory:", urls.length);
  console.log("Already mapped:", Object.keys(mapping).length);
  console.log("This batch:", remaining.length);

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < remaining.length; i++) {
    const sourceUrl = remaining[i];
    console.log(`\n[${i + 1}/${remaining.length}] Checking source...`);

    try {
      const source = await fetch(sourceUrl, { method: "HEAD" });
      if (!source.ok) {
        throw new Error(`Source HTTP ${source.status}`);
      }

      const publicId = "img-" + crypto
        .createHash("sha256")
        .update(sourceUrl)
        .digest("hex")
        .slice(0, 32);

      const uploaded = await cloudinary.uploader.upload(sourceUrl, {
        folder: FOLDER,
        public_id: publicId,
        resource_type: "image",
        overwrite: false
      });

      mapping[sourceUrl] = uploaded.secure_url;
      fs.writeFileSync(mapPath, JSON.stringify(mapping, null, 2));

      console.log("SUCCESS", uploaded.secure_url);
      succeeded++;
    } catch (error) {
      console.log("FAILED:", error.message);
      failures.push({
        source_url: sourceUrl,
        error: error.message,
        failed_at: new Date().toISOString()
      });
      fs.writeFileSync(failedPath, JSON.stringify(failures, null, 2));
      failed++;
    }
  }

  console.log("\nBatch finished.");
  console.log("Succeeded:", succeeded);
  console.log("Failed:", failed);
  console.log("Total mapped:", Object.keys(mapping).length);
  console.log("Remaining:", urls.length - Object.keys(mapping).length);
  console.log("Database changed: NO");
  console.log("Supabase files deleted: NO");
}

main().catch(error => {
  console.error("Migration stopped:", error.message);
  process.exitCode = 1;
});
