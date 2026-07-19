#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const renderer = resolve(scriptDirectory, "render-mermaid.mjs");
const usage = `Usage: sync-rendered-mermaid.mjs [--width <columns>] (--check | --write) <file>...

Ensure every \`\`\`mermaid block is immediately followed by a generated
\`\`\`rendered-mermaid block. Existing rendered-mermaid blocks are replaced.
The Mermaid block's line prefix is applied to each inserted line, so commented
Markdown in source files needs no language-specific handling.`;

let width = 100;
let mode;
const paths = [];

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

  if (argument === "--check" || argument === "--write") {
    if (mode) throw new Error("Provide exactly one of --check or --write");
    mode = argument;
    continue;
  }

  if (argument.startsWith("-")) {
    throw new Error(`Unknown option: ${argument}`);
  }

  paths.push(argument);
}

if (!mode || paths.length === 0) {
  throw new Error(usage);
}

function contentWithPrefix(line, prefix) {
  if (line.startsWith(prefix)) return line.slice(prefix.length);

  // Comment-only blank lines conventionally omit the trailing space in "# " or
  // "// ". Treat them as blank while keeping the exact prefix on generated art.
  if (prefix.endsWith(" ") && line === prefix.trimEnd()) return "";

  return null;
}

function isFence(line, prefix, language) {
  const content = contentWithPrefix(line, prefix);
  return content !== null && content.trimEnd() === `\`\`\`${language}`;
}

function isBlank(line, prefix) {
  const content = contentWithPrefix(line, prefix);
  return content !== null && content.trim() === "";
}

function closingFence(lines, start, prefix) {
  for (let index = start + 1; index < lines.length; index += 1) {
    const content = contentWithPrefix(lines[index], prefix);
    if (content === null) {
      throw new Error(
        `Line ${index + 1}: Mermaid block prefix differs from opening prefix`,
      );
    }
    if (/^```\s*$/.test(content)) return index;
  }

  throw new Error(`Line ${start + 1}: Mermaid block has no closing fence`);
}

function render(source) {
  return execFileSync(process.execPath, [renderer, "--width", String(width)], {
    encoding: "utf8",
    input: source,
  }).replace(/\n$/, "");
}

function generatedBlock(prefix, diagram) {
  const lines = ["```rendered-mermaid", ...diagram.split("\n"), "```"];
  return lines.map((line) => `${prefix}${line}`);
}

function syncText(text) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const endsWithEol = text.endsWith(eol);
  const lines = text.split(/\r?\n/);
  if (endsWithEol) lines.pop();

  const output = [];
  let changed = false;

  for (let index = 0; index < lines.length;) {
    const marker = lines[index].indexOf("```mermaid");
    if (marker === -1 || !/^```mermaid\s*$/.test(lines[index].slice(marker))) {
      output.push(lines[index]);
      index += 1;
      continue;
    }

    const prefix = lines[index].slice(0, marker);
    const close = closingFence(lines, index, prefix);
    const diagram = lines
      .slice(index + 1, close)
      .map((line) => contentWithPrefix(line, prefix))
      .join("\n");
    const block = generatedBlock(prefix, render(diagram));
    let next = close + 1;
    while (next < lines.length && isBlank(lines[next], prefix)) next += 1;

    const gap = lines.slice(close + 1, next);
    output.push(...lines.slice(index, close + 1));
    output.push(...(gap.length > 0 ? gap : [prefix.trimEnd()]));

    if (
      next < lines.length &&
      isFence(lines[next], prefix, "rendered-mermaid")
    ) {
      const renderedClose = closingFence(lines, next, prefix);
      const existing = lines.slice(next, renderedClose + 1);
      if (existing.join("\n") !== block.join("\n")) changed = true;
      output.push(...block);
      index = renderedClose + 1;
      continue;
    }

    changed = true;
    output.push(...block);
    if (next < lines.length) {
      output.push(...(gap.length > 0 ? gap : [prefix.trimEnd()]));
    }
    index = next;
  }

  const result = output.join(eol) + (endsWithEol ? eol : "");
  return { changed, text: result };
}

const stale = [];
for (const path of paths) {
  const original = readFileSync(path, "utf8");
  const result = syncText(original);
  if (!result.changed) continue;

  stale.push(path);
  if (mode === "--write") writeFileSync(path, result.text);
}

if (stale.length === 0) {
  console.log("All rendered Mermaid blocks are current.");
  process.exit(0);
}

for (const path of stale)
  console.log(`${mode === "--write" ? "Updated" : "Stale"}: ${path}`);
if (mode === "--check") process.exit(1);
