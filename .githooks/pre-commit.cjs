#!/usr/bin/env node
// Auto-format staged files with Prettier and re-stage them,
// then abort if ESLint finds violations,
// then rebuild map.min.js if map.js was staged,
// then rebuild map.min.css if map.css was staged.
//
// Everything this hook checks or stages is the content that is actually being
// committed. `git add <file>` stages the whole working-tree file, so a file that
// is only partially staged (git add -p) is never written to or re-added here:
// that would pull the unstaged hunks into the commit as well.

const { execFileSync } = require("child_process");
const { existsSync } = require("fs");

const node = process.execPath;

function run(cmd, args, { ignoreError = false } = {}) {
    try {
        execFileSync(node, args, { "stdio": "inherit" });
    } catch (_e) {
        if (!ignoreError) process.exit(1);
    }
}

// Never build a shell string out of a file name. A staged file can be called
// anything, and in /bin/sh $(...), backticks and \ stay active inside double
// quotes, so quoting is not enough. execFileSync hands argv straight to git and
// no shell ever parses it.
function git(...args) {
    return execFileSync("git", args, { "encoding": "utf8" });
}

// Stage one path. "--" stops a leading dash from being read as an option, and
// ":(literal)" switches off pathspec magic, so a file called "foo[1].js" is
// staged as itself instead of being interpreted as a glob.
function gitAdd(file) {
    execFileSync("git", ["add", "--", ":(literal)" + file], { "stdio": "inherit" });
}

// The file as it is staged, read straight from the index. Returned as a Buffer,
// so nothing is transcoded on the way to prettier or eslint.
function stagedContent(file) {
    try {
        return execFileSync("git", ["show", ":" + file]);
    } catch (_e) {
        console.error("pre-commit: cannot read the staged version of " + file);
        return process.exit(1);
    }
}

// Get staged files (excluding history/). The -z output is NUL separated and has
// no trailing newline, so it is not trimmed: that would corrupt a file name with
// leading or trailing whitespace. The filter below drops the empty string that
// the trailing NUL produces.
const staged = git("diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z")
    .split("\0")
    .filter((f) => f && !f.startsWith("history/"));

// Files whose working tree differs from what is staged, so `git add` on them
// would stage more than the user selected. Empty in the normal case where a
// whole file was staged.
const partiallyStaged = new Set(git("diff", "--name-only", "-z").split("\0").filter(Boolean));

const jsFiles = staged.filter((f) => f.endsWith(".js") || f.endsWith(".mjs") || f.endsWith(".cjs"));
const htmlFiles = staged.filter((f) => f.endsWith(".html"));
const jsonFiles = staged.filter((f) => f.endsWith(".json"));
const mdFiles = staged.filter((f) => f.endsWith(".md"));
const cssFiles = staged.filter((f) => f.endsWith(".css"));
const ymlFiles = staged.filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
const prettierFiles = [...jsFiles, ...htmlFiles, ...jsonFiles, ...mdFiles, ...cssFiles, ...ymlFiles];

if (prettierFiles.length === 0) process.exit(0);

// Prettier
const prettierBin = "node_modules/prettier/bin/prettier.cjs";
if (!existsSync(prettierBin)) {
    console.error("pre-commit: prettier not found, run npm install");
    process.exit(1);
}
const needsManualFormat = [];
for (const file of prettierFiles) {
    if (partiallyStaged.has(file)) {
        // Leave the working tree alone and check what is staged instead. When
        // that is already formatted there is nothing to fix and the commit can
        // go ahead untouched.
        try {
            execFileSync(node, [prettierBin, "--check", "--stdin-filepath", file], {
                "input": stagedContent(file),
                "stdio": ["pipe", "ignore", "ignore"]
            });
        } catch (_e) {
            needsManualFormat.push(file);
        }
        continue;
    }
    run("prettier", [prettierBin, "--write", file]);
    gitAdd(file);
}
if (needsManualFormat.length > 0) {
    console.error("pre-commit: these files are only partially staged and what is staged is not formatted:");
    for (const file of needsManualFormat) {
        console.error("  " + file);
    }
    console.error("Formatting them here would stage the unstaged changes as well, so the hook stops.");
    console.error("Run 'npm run format' and stage the result, or stage the whole file.");
    process.exit(1);
}

// ESLint. Always run on the staged content: that is what the commit contains,
// and for a fully staged file it is identical to the working tree anyway.
if (jsFiles.length > 0) {
    const eslintBin = "node_modules/eslint/bin/eslint.js";
    if (!existsSync(eslintBin)) {
        console.error("pre-commit: eslint not found, run npm install");
        process.exit(1);
    }
    for (const file of jsFiles) {
        try {
            execFileSync(node, [eslintBin, "--stdin", "--stdin-filename", file], {
                "input": stagedContent(file),
                "stdio": ["pipe", "inherit", "inherit"]
            });
        } catch (_e) {
            process.exit(1);
        }
    }
}

// Rebuild map.min.js when map.js is staged
if (jsFiles.includes("map.js")) {
    if (partiallyStaged.has("map.js")) {
        console.error("pre-commit: map.js is only partially staged, so map.min.js cannot be rebuilt to match it.");
        console.error("Stage map.js completely, or commit with --no-verify and rebuild afterwards.");
        process.exit(1);
    }
    const terserBin = "node_modules/terser/bin/terser";
    if (!existsSync(terserBin)) {
        console.error("pre-commit: terser not found, run npm install");
        process.exit(1);
    }
    console.log("pre-commit: rebuilding map.min.js..");
    run("terser", [terserBin, "map.js", "-o", "map.min.js", "--compress", "--mangle"]);
    gitAdd("map.min.js");
    console.log("pre-commit: map.min.js staged.");
}

// Rebuild map.min.css when map.css is staged
if (cssFiles.includes("map.css")) {
    if (partiallyStaged.has("map.css")) {
        console.error("pre-commit: map.css is only partially staged, so map.min.css cannot be rebuilt to match it.");
        console.error("Stage map.css completely, or commit with --no-verify and rebuild afterwards.");
        process.exit(1);
    }
    const cleanCssPackage = "node_modules/clean-css/package.json";
    if (!existsSync(cleanCssPackage)) {
        console.error("pre-commit: clean-css not found, run npm install");
        process.exit(1);
    }
    console.log("pre-commit: rebuilding map.min.css..");
    run("minify-css", ["scripts/minify-css.mjs"]);
    gitAdd("map.min.css");
    console.log("pre-commit: map.min.css staged.");
}
