import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../");

// find the file
const files = await fs.readdir(root);
const dawn = files.find((file) => file.startsWith("dawn-"));

if(dawn != null) {
    await fs.rm(path.join(root, dawn), { force: true });
}
await fs.rm(path.join(root, "dawn.node"), { force: true });
await fs.rm(path.join(root, "out"), { recursive: true, force: true });
await fs.rm(path.join(root, "build"), { recursive: true, force: true });