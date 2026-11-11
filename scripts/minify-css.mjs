import { readFileSync, writeFileSync } from "node:fs";
import CleanCSS from "clean-css";

const inputFile = "map.css";
const outputFile = "map.min.css";
const input = readFileSync(inputFile, "utf8");
const output = new CleanCSS().minify(input);

if (output.errors.length > 0 || output.warnings.length > 0) {
    for (const error of output.errors) console.error(error);
    for (const warning of output.warnings) console.warn(warning);
    throw new Error("CSS minification failed");
}

writeFileSync(outputFile, output.styles);
