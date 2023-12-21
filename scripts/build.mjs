import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import os from "node:os";
import { exec } from "node:child_process";
const aexec = promisify(exec);
import { promisify } from "node:util";
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const { platform } = process;

const versions = {
    "dawn": {
        "repo": "https://dawn.googlesource.com/dawn",
        "version": "464418b24f65fce81114f6af89b611900f988424"
    },
    "depot_tools": {
        "repo": "https://chromium.googlesource.com/chromium/tools/depot_tools.git",
        "version": "007dd45a94b8fe400fb69113f7999fed185cb5c1"
    }
};

const root = path.resolve(__dirname, "../");
const buildDir = path.resolve(root, "build");
const outDir = path.resolve(root, "out");
const dawnDir = path.resolve(buildDir, "dawn");
const depotDir = path.resolve(buildDir, "depot");
const isWin = platform === "win32";

function log(step, status) {
    console.log(`[${step}] ${new Date().toISOString()} ${status}`);
}

async function downloadPkg(location, repo, commit, force = false) {
    if (!force) {
        const stat = await fs.promises.stat(location).catch(() => { });
        if (stat) return;
    }
    await fs.promises.rm(location, { recursive: true }).catch(() => { });
    await fs.promises.mkdir(location, { recursive: true });
    const flags = commit == "HEAD" ? [] : [`git fetch --depth=1 origin ${commit}`, `git checkout ${commit}`];
    await aexec([
        `git clone --depth=1 ${repo} ${location}`,
        `cd ${location}`,
        ...flags
    ].join(" && "), {
        cwd: root,
        env: {
            ...process.env,
        }
    });
}

// Download dawn and depot_tools
log("Dawn", "cloning");
await downloadPkg(dawnDir, versions.dawn.repo, versions.dawn.version, false);
log("Dawn", "cloned");
log("Depot Tools", "cloning");
await downloadPkg(depotDir, versions.depot_tools.repo, versions.depot_tools.version, false);
log("Depot Tools", "cloned");
const targetArch = process.env.TARGET_ARCH;
const isMac = platform === "darwin";

const sep = isWin ? `;` : ":";
const depotIncludedPath = `${depotDir}${sep}${process.env.PATH}`
if (isWin) {
    // run windows to install neccessary tools
    log("gclient", "starting windows dry run")
    await aexec(`gclient`, {
        cwd: depotDir,
        env: {
            ...process.env,
            PATH: depotIncludedPath,
            DEPOT_TOOLS_UPDATE: '0',
            DEPOT_TOOLS_WIN_TOOLCHAIN: '0',
        },
    })
    log("gclient", "finished windows dry run");
}

// Install dependencies
await fs.promises.copyFile(path.join(buildDir, "dawn", "scripts", "standalone-with-node.gclient"), path.join(buildDir, "dawn", ".gclient"));

log("Dawn", `installing dependencies ${sep}`);

const {stdout, stderr} = await aexec(`gclient sync --no-history -j${os.cpus().length} -vvv `,
    {
        cwd: dawnDir,
        env: {
            ...process.env,
            PATH: depotIncludedPath,
            DEPOT_TOOLS_UPDATE: '0',
            DEPOT_TOOLS_WIN_TOOLCHAIN: '0',
        }
    });
console.log(stdout);
console.log(stderr);

log("Dawn", "installed dependencies");

 
let cflags = ""; //(isMac && targetArch) ? "-mmacosx-version-min=11.0" : "";
let ldflags = ""; // (isMac && targetArch) ? "-mmacosx-version-min=11.0" : "";
const flags = [
    `-S ${path.join(buildDir, "dawn")}`,
    `-B ${path.join(outDir, "dawn")}`,
    '-GNinja',
    '-DCMAKE_BUILD_TYPE=Release',
    '-DDAWN_BUILD_NODE_BINDINGS=1',
    '-DTINT_BUILD_SAMPLES=0',
    '-DTINT_BUILD_TESTS=0',
    '-DDAWN_BUILD_SAMPLES=0',
    targetArch ? '-DCMAKE_OSX_ARCHITECTURES=arm64' : ''
];

log("Dawn", "building");
const cmakeBuild = await aexec(`cmake ${flags.join(' ')}`, {
    cwd: root,
    env: {
        ...process.env,
        cflags,
        ldflags,
    }
})
console.log(cmakeBuild.stdout);
console.log(cmakeBuild.stderr);
log("Dawn", "built");

log("Dawn", "running ninja");
try {
    const ninja = await aexec(`ninja -C ${path.join(outDir, "dawn")} -j${os.cpus().length} dawn.node`, {
        cwd: root,
        env: {
            ...process.env,
            DEPOT_TOOLS_WIN_TOOLCHAIN: '0'
        }
    });
    console.log(ninja.stdout);
    console.log(ninja.stderr);
    log("Dawn", "finished ninja");
} catch (e) {
    console.error("[Dawn] error: ", e);
    process.exit(1);
}
await fs.promises.copyFile(path.join(outDir, "dawn", "dawn.node"), path.join(root, "dawn.node"));
log("build", "finished");