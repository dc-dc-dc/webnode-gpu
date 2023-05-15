import fs from "node:fs";
import url from "node:url";
import path from "node:path";
import pkg from "../package.json" assert { type: "json" };
import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const { platform, arch } = process;
const targetArch = process.env.CC_ARCH || arch;
const name = `dawn-v${pkg.version}-${platform}-${targetArch}.gz`;

const root = path.resolve(__dirname, "../");
const gzip = createGzip();
const readStream = fs.createReadStream(path.resolve(root, "dawn.node"));
const writeStream = fs.createWriteStream(path.resolve(root, name));

try {
    await pipeline(readStream, gzip, writeStream);
} catch (e) {
    console.error(e);
    process.exit(1);
}

const gitHeaders = {
    "Accept": "application/vnd.github.v3+json",
    "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
}

const buff = await fs.promises.readFile(path.resolve(root, name));

await fetch(`https://api.github.com/repos/dc-dc-dc/webnode-gpu/releases/v0.0.4a/assets/?name=${name}`, {
    method: "POST",
    headers: {
        ...gitHeaders,
        "Content-Type": "application/gzip",
    },
    body: buff,
});