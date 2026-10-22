const fs = require("fs");

const mapping = JSON.parse(
  fs.readFileSync("./cloudinary-migration-map.json", "utf8")
);

const entries = Object.entries(mapping);
const resultsPath = "./cloudinary-migration-verification.json";
const results = {};
let next = 0;
let checked = 0;

async function verify(url) {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(20000)
    });

    return {
      status: response.status,
      ok: response.ok,
      checked_at: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: null,
      ok: false,
      error: error.message,
      checked_at: new Date().toISOString()
    };
  }
}

async function worker() {
  while (true) {
    const index = next++;
    if (index >= entries.length) return;

    const [sourceUrl, cloudinaryUrl] = entries[index];
    results[sourceUrl] = await verify(cloudinaryUrl);
    checked++;

    if (checked % 25 === 0 || checked === entries.length) {
      fs.writeFileSync(
        resultsPath,
        JSON.stringify(results, null, 2)
      );
      console.log(`Checked ${checked}/${entries.length}`);
    }
  }
}

async function main() {
  console.log("URLs to verify:", entries.length);
  console.log("Concurrent requests: 12");
  console.log("Database changed: NO");
  console.log("Supabase files deleted: NO");

  await Promise.all(
    Array.from({ length: 12 }, () => worker())
  );

  const passed = Object.values(results).filter(r => r.ok).length;
  const failed = Object.entries(results).filter(([, r]) => !r.ok);

  console.log("\n--- Cloudinary Verification Summary ---");
  console.log("Total checked:", checked);
  console.log("HTTP success:", passed);
  console.log("Failed:", failed.length);
  console.log("Results saved to:", resultsPath);

  if (failed.length) {
    console.log("\nFailed URL examples:");
    for (const [source, result] of failed.slice(0, 10)) {
      console.log({
        source,
        status: result.status,
        error: result.error || null
      });
    }
  }

  console.log(
    "\nVerification:",
    checked === entries.length && failed.length === 0
      ? "PASS"
      : "CHECK REQUIRED"
  );
}

main().catch(error => {
  console.error("Verification stopped:", error.message);
  process.exitCode = 1;
});
