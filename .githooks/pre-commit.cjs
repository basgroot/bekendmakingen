#!/usr/bin/env node
// Auto-format staged files with Prettier and re-stage them,
// then abort if ESLint finds violations,
// then rebuild map.min.js if map.js was staged.

const { execFileSync, execSync } = require("child_process");
const { existsSync } = require("fs");

const node = process.execPath;

function run(cmd, args, { ignoreError = false } = {}) {
    try {
        execFileSync(node, args, { "stdio": "inherit" });
    } catch (_e) {
        if (!ignoreError) process.exit(1);
    }
}

function git(...args) {
    return execSync("git " + args.join(" "), { "encoding": "utf8" }).trim();
}

// Get staged files (excluding history/)
const staged = git("diff --cached --name-only --diff-filter=ACMR -z")
    .split("\0")
    .filter((f) => f && !f.startsWith("history/"));

const jsFiles = staged.filter((f) => f.endsWith(".js"));
const htmlFiles = staged.filter((f) => f.endsWith(".html"));
const jsonFiles = staged.filter((f) => f.endsWith(".json"));
const mdFiles = staged.filter((f) => f.endsWith(".md"));
const prettierFiles = [...jsFiles, ...htmlFiles, ...jsonFiles, ...mdFiles];

if (prettierFiles.length === 0) process.exit(0);

// Prettier
const prettierBin = "node_modules/prettier/bin/prettier.cjs";
if (!existsSync(prettierBin)) {
    console.error("pre-commit: prettier not found, run npm install");
    process.exit(1);
}
for (const file of prettierFiles) {
    run("prettier", [prettierBin, "--write", file]);
    execSync("git add " + JSON.stringify(file));
}

// ESLint
if (jsFiles.length > 0) {
    const eslintBin = "node_modules/eslint/bin/eslint.js";
    if (!existsSync(eslintBin)) {
        console.error("pre-commit: eslint not found, run npm install");
        process.exit(1);
    }
    for (const file of jsFiles) {
        run("eslint", [eslintBin, file]);
    }
}

// Rebuild map.min.js when map.js is staged
if (jsFiles.includes("map.js")) {
    const terserBin = "node_modules/terser/bin/terser";
    if (!existsSync(terserBin)) {
        console.error("pre-commit: terser not found, run npm install");
        process.exit(1);
    }
    console.log("pre-commit: rebuilding map.min.js..");
    run("terser", [terserBin, "map.js", "-o", "map.min.js", "--compress", "--mangle"]);
    execSync("git add map.min.js");
    console.log("pre-commit: map.min.js staged.");
}
