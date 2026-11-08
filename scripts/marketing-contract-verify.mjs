import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const directory = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/lib/marketing");
const manifest = JSON.parse(await fs.readFile(path.join(directory, "contract-version.json"), "utf8"));
for (const [file, expected] of Object.entries(manifest.files)) {
  const actual = createHash("sha256").update(await fs.readFile(path.join(directory, file))).digest("hex");
  if (actual !== expected) throw new Error(`Marketing contract changed without reconciliation: ${file}`);
}
console.log(`Marketing contract ${manifest.fingerprint}`);
