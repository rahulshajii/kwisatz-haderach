const fs = require("fs");
const { execSync } = require("child_process");

// 1. Read .env.production.local
const content = fs.readFileSync(".env.production.local", "utf8");
const envVars = {};

content.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx > 0) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[key] = val;
  }
});

const dbUrl = envVars.DATABASE_URL || envVars.POSTGRES_PRISMA_URL || envVars.POSTGRES_URL;
if (!dbUrl) {
  console.error("No DATABASE_URL found in .env.production.local");
  process.exit(1);
}

console.log("Found Neon DATABASE_URL, syncing schema...");

const env = { ...process.env, DATABASE_URL: dbUrl };

try {
  execSync("npx prisma db push --accept-data-loss", {
    env,
    stdio: "inherit",
  });
  console.log("✓ Schema pushed to Neon cloud database!");

  execSync("node prisma/seed.js", {
    env,
    stdio: "inherit",
  });
  console.log("✓ Demo data and questions seeded to Neon cloud database!");
} catch (err) {
  console.error("Execution failed:", err.message);
  process.exit(1);
}
