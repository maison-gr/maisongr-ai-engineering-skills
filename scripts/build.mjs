// Generates the platform instruction files from AGENTS.md, the single source of the principles.
//
//   node scripts/build.mjs          write the generated files
//   node scripts/build.mjs --check  exit 1 if any generated file is out of date

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const notice = "Generated from AGENTS.md by scripts/build.mjs. Edit AGENTS.md, then run the script.";

export function read(path) {
  return readFileSync(join(root, path), "utf8").replace(/\r\n/g, "\n");
}

export function outputs() {
  const source = read("AGENTS.md");
  const comment = `<!-- ${notice} -->\n\n`;

  return {
    // Cursor project rule. Cursor ignores plain .md files in .cursor/rules, so this must be .mdc.
    ".cursor/rules/maisongr-engineering.mdc":
      "---\n" +
      "description: Maison GR engineering principles for understanding, changing and verifying code.\n" +
      "alwaysApply: true\n" +
      "---\n\n" +
      comment +
      source,
    // Loaded by the Gemini CLI extension (GEMINI.md in the extension root) and by Gemini working in this repo.
    "GEMINI.md": comment + source,
    // Read by Copilot chat, the Copilot cloud agent and Copilot code review.
    ".github/copilot-instructions.md": comment + source,
  };
}

function main() {
  const check = process.argv.includes("--check");
  const stale = [];

  for (const [path, content] of Object.entries(outputs())) {
    const target = join(root, path);
    const current = existsSync(target) ? read(path) : null;
    if (current === content) continue;
    if (check) {
      stale.push(path);
    } else {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, content);
      console.log(`wrote ${path}`);
    }
  }

  if (stale.length) {
    console.error(`Out of date: ${stale.join(", ")}. Run: node scripts/build.mjs`);
    process.exit(1);
  }
  if (check) console.log("Generated files are up to date.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
