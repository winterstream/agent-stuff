---
name: mermaid-render
description:
  Render supported Mermaid diagrams as Unicode terminal art on stdout, so the
  result can be embedded inline in source files, documentation, or comments.
---

# Mermaid Render

Use `./render-mermaid.mjs` when the user wants a rendered Mermaid diagram
embedded as text rather than a `mermaid` fenced block. It reuses the terminal
renderer from `pi-grok-mermaid` and writes only Unicode diagram text to standard
output. Use `./sync-rendered-mermaid.mjs` to insert or update generated renders
in text files.

## Supported diagrams

- `graph` / `flowchart`, including subgraphs
- `sequenceDiagram`
- `stateDiagram`
- `classDiagram`
- `erDiagram`

The renderer is terminal art, **not SVG or PNG**. It may fall back to framed
source for unsupported or over-wide diagrams.

## Render

Pass a Mermaid file:

```sh
node ./render-mermaid.mjs --width 100 diagram.mmd
```

Or pipe Mermaid source to standard input:

```sh
printf 'flowchart LR\n  Source --> Rendered\n' \
  | node ./render-mermaid.mjs --width 100
```

`--width` sets the target terminal width and defaults to `100` columns.

## Embed safely

1. Render the diagram to a temporary file or capture its stdout.
2. Inspect the complete rendered output before editing.
3. Embed it in a `rendered-mermaid` fenced block. For source code, apply the
   source Mermaid block's existing line prefix to every generated line.
4. Preserve the original Mermaid source when it remains useful to edit the
   diagram later; rendered Unicode art is not a maintainable diagram format.

## Synchronise rendered blocks

`sync-rendered-mermaid.mjs` finds Mermaid fences in one or more text files and
ensures each is followed by an exact generated `rendered-mermaid` fence. It
updates only explicitly marked `rendered-mermaid` blocks.

The script derives the common prefix from the Mermaid block itself. Thus a block
whose lines begin with `# ` or `// ` produces correctly prefixed generated
output without language-specific comment parsing.

Preview stale or missing blocks without changing files:

```sh
node ./sync-rendered-mermaid.mjs --width 120 --check README.md src/example.py
```

Write updates after review:

```sh
node ./sync-rendered-mermaid.mjs --width 120 --write README.md src/example.py
```

`--check` exits non-zero when a file needs updating. Exactly one of `--check` or
`--write` is required.

Do not claim that this creates an image, data URI, SVG, or PNG. For those
formats, use a dedicated Mermaid SVG/PNG renderer instead.
