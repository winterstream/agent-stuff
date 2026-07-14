#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { latexToUnicode } from "../src/latex-to-unicode.js";

const args = process.argv.slice(2);
const source = args.length > 0 ? args.join(" ") : await readFile("/dev/stdin", "utf8");
process.stdout.write(`${latexToUnicode(source)}\n`);
