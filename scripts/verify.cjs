const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");

const root = process.cwd();
const buildDist = ".next-verify-build";
const e2eDist = ".next-verify-e2e";
const restoreFiles = ["next-env.d.ts", "tsconfig.json"];
const backups = new Map();

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: { ...process.env, ...(options.env || {}) }
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });

    child.on("error", reject);
  });
}

async function backupFiles() {
  for (const file of restoreFiles) {
    backups.set(file, await fs.readFile(path.join(root, file), "utf8"));
  }
}

async function restoreFilesFromBackup() {
  await Promise.all(
    [...backups.entries()].map(([file, contents]) =>
      fs.writeFile(path.join(root, file), contents, "utf8")
    )
  );
}

async function main() {
  await backupFiles();

  try {
    await run("npm", ["run", "lint"]);
    await run("node", [path.join("scripts", "clean-next.cjs"), buildDist]);
    await run("npx", ["next", "build"], { env: { NEXT_DIST_DIR: buildDist } });
    await run("node", [path.join("scripts", "clean-next.cjs"), e2eDist]);
    await run("node", [path.join("e2e", "acceptance.cjs")], { env: { NEXT_DIST_DIR: e2eDist } });
  } finally {
    await restoreFilesFromBackup();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
