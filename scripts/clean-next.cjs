const fs = require("fs");
const path = require("path");

const targetArg = process.argv[2] || process.env.NEXT_DIST_DIR || ".next";
const target = path.resolve(process.cwd(), targetArg);

try {
  fs.rmSync(target, { recursive: true, force: true });
  console.log(`Removed ${target}`);
} catch (error) {
  console.error(`Failed to remove ${target}`);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
