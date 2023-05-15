import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import os from "node:os";
import { createGunzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { finished } from "stream/promises";
import { Readable } from "node:stream";
import pkg from "../package.json" assert { type: "json" };

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../");
const { platform, arch } = process;
const targetArch = process.env.CC_ARCH || arch;
const name = `dawn-v${pkg.version}-${platform}-${targetArch}.gz`;


function log(step, status) {
    console.log(`[${step}] ${new Date().toISOString()} ${status}`);
}

// remove if already there for whatever reason
const zipDest = path.resolve(root, name);

fs.existsSync(zipDest) && fs.rmSync(zipDest);

const assetURL = `https://github.com/dc-dc-dc/webnode-gpu/releases/download/v${pkg.version}/${name}`;
const res = await fetch(assetURL);
if (res.status !== 200) {
    throw new Error(`release asset not found for ${assetURL}`);
}

await finished(Readable.fromWeb(res.body)
    .pipe(fs.createWriteStream(zipDest, { flags: "w" })));

// Download the zip if it exists
log("Gunzip", "de-compressing");
const gunzip = createGunzip();
const readZipStream = fs.createReadStream(zipDest);
const writeBinStream = fs.createWriteStream(path.resolve(root, "dawn.node"));

await pipeline(readZipStream, gunzip, writeBinStream);
log("Gunzip", "finished decompressing");
// Decompress 