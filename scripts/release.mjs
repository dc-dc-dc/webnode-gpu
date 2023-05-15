import fs from "node:fs";
import url from "node:url";
import path from "node:path";
import pkg from "../package.json" assert { type: "json" };
import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const { platform, arch } = process;

const targetArch = process.env.TARGET_ARCH || arch;
const name = `dawn-v${pkg.version}-${platform}-${targetArch}.gz`;
const root = path.resolve(__dirname, "../");
const gzip = createGzip();
const readStream = fs.createReadStream(path.resolve(root, "dawn.node"));
const writeStream = fs.createWriteStream(path.resolve(root, name));

function log(step, status) {
    console.log(`[${step}] ${new Date().toISOString()} ${status}`);
}

log("Gzip", "compressing");

try {
    await pipeline(readStream, gzip, writeStream);
} catch (e) {
    console.error(e);
    process.exit(1);
}

log("Gzip", "compressed");

const gitHeaders = {
    "Accept": "application/vnd.github+json",
    "X-Github-Api-Version": "2022-11-28",
    "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
    "User-Agent": "@dc_dc_dc/webnode-gpu"
}

log("release", "fetching releases");
const releaseReq = await fetch(`https://api.github.com/repos/dc-dc-dc/webnode-gpu/releases`, { headers: { ...gitHeaders } });
if (releaseReq.status != 200) {
    throw new Error(`release request unexpected status ${releaseReq.status} ${releaseReq.statusText}`);
}
const releaseData = await releaseReq.json();
const release = releaseData.find((r) => r.tag_name === `v${pkg.version}`);

if (!release) {
    throw new Error(`release not found with version v${pkg.version}`);
}
const buff = await fs.promises.readFile(path.resolve(root, name));

const assetURL = `https://uploads.github.com/repos/dc-dc-dc/webnode-gpu/releases/${release.id}/assets?name=${name}`
log("upload", `starting upload ${name} to ${assetURL}`);
const res = await fetch(assetURL, {
    method: "POST",
    headers: {
        ...gitHeaders,
        "Content-Type": "application/gzip",
    },
    body: buff,
});

log("upload", `upload got status ${res.status} ${res.statusText}`)

if (res.status !== 201) {
    const data = await res.text();
    throw new Error(`unexpected status ${res.status} ${res.statusText} ${data}`);
}