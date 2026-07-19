import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

const script = resolve("skills/mermaid-render/sync-rendered-mermaid.mjs");

function fixture(files) {
  const directory = mkdtempSync(resolve(tmpdir(), "sync-rendered-mermaid-"));
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(resolve(directory, name), content);
  }
  return directory;
}

function run(mode, ...paths) {
  return spawnSync(
    process.execPath,
    [script, "--width", "120", mode, ...paths],
    { encoding: "utf8" },
  );
}

function read(path) {
  return readFileSync(path, "utf8");
}

function remove(directory) {
  rmSync(directory, { force: true, recursive: true });
}

const diagram = ["```mermaid", "flowchart TD", "  A --> B", "```"];

test("inserts a missing rendered-mermaid block and check mode becomes current", () => {
  const directory = fixture({ "example.md": [...diagram, ""].join("\n") });
  const path = resolve(directory, "example.md");

  try {
    const stale = run("--check", path);
    assert.equal(stale.status, 1);
    assert.match(stale.stdout, /Stale:/);

    assert.equal(run("--write", path).status, 0);
    const output = read(path);
    assert.match(
      output,
      /```mermaid[\s\S]*?```\n\n```rendered-mermaid\n[\s\S]*?┌/,
    );
    assert.equal(run("--check", path).status, 0);
  } finally {
    remove(directory);
  }
});

test("updates an explicitly marked stale rendered-mermaid block", () => {
  const directory = fixture({
    "example.md": [
      ...diagram,
      "",
      "```rendered-mermaid",
      "stale",
      "```",
      "",
    ].join("\n"),
  });
  const path = resolve(directory, "example.md");

  try {
    assert.equal(run("--write", path).status, 0);
    const output = read(path);
    assert.doesNotMatch(output, /stale/);
    assert.match(output, /```rendered-mermaid\n[\s\S]*?┌/);
  } finally {
    remove(directory);
  }
});

test("uses the Mermaid block prefix for generated comment output", () => {
  const directory = fixture({
    "example.js": [
      "// ```mermaid",
      "// flowchart TD",
      "//   A --> B",
      "// ```",
      "",
    ].join("\n"),
  });
  const path = resolve(directory, "example.js");

  try {
    assert.equal(run("--write", path).status, 0);
    const output = read(path);
    assert.match(output, /\/\/ ```rendered-mermaid\n\/\/\s+┌/);
    assert.match(output, /\/\/ ```\n$/);
  } finally {
    remove(directory);
  }
});

test("preserves an ordinary text block and is idempotent", () => {
  const directory = fixture({
    "example.md": [
      ...diagram,
      "",
      "```text",
      "This is hand-written text.",
      "```",
      "",
    ].join("\n"),
  });
  const path = resolve(directory, "example.md");

  try {
    assert.equal(run("--write", path).status, 0);
    const first = read(path);
    assert.match(
      first,
      /```rendered-mermaid[\s\S]*?```\n\n```text\nThis is hand-written text\./,
    );

    assert.equal(run("--write", path).status, 0);
    assert.equal(read(path), first);
  } finally {
    remove(directory);
  }
});

test("requires exactly one write mode and at least one path", () => {
  const result = spawnSync(process.execPath, [script, "--check"], {
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Usage:/);

  execFileSync(process.execPath, [script, "--help"], { encoding: "utf8" });
});
