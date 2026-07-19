#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const usage = `Usage: render-mermaid.mjs [--width <columns>] [diagram.mmd]

Render Mermaid source as Unicode terminal art. Reads standard input when no file is given.`;

let width = 100;
let inputPath;

for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];

  if (argument === "--help" || argument === "-h") {
    console.log(usage);
    process.exit(0);
  }

  if (argument === "--width") {
    const value = Number(process.argv[++index]);
    if (!Number.isInteger(value) || value < 1) {
      throw new Error("--width must be a positive integer");
    }
    width = value;
    continue;
  }

  if (argument.startsWith("-")) {
    throw new Error(`Unknown option: ${argument}`);
  }

  if (inputPath) {
    throw new Error("Provide at most one Mermaid input file");
  }
  inputPath = argument;
}

const source = inputPath
  ? readFileSync(inputPath, "utf8")
  : readFileSync(0, "utf8");
if (!source.trim()) process.exit(0);

const wasmPath = require.resolve("pi-grok-mermaid/vendor/grok-mermaid.wasm");
const bytes = readFileSync(wasmPath);
const { exports } = new WebAssembly.Instance(new WebAssembly.Module(bytes), {});
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const input = encoder.encode(source);
const pointer = exports.wasm_alloc(input.byteLength);
new Uint8Array(exports.memory.buffer, pointer, input.byteLength).set(input);
const outputLength = exports.wasm_render_html(pointer, input.byteLength, width);
const outputPointer = exports.wasm_result_ptr();
const html = decoder.decode(
  new Uint8Array(exports.memory.buffer, outputPointer, outputLength),
);

const text = html
  .replaceAll(/<span class="[^"]*">([\s\S]*?)<\/span>/g, "$1")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&amp;", "&");

process.stdout.write(text);
