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
output.

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
3. Embed it using syntax appropriate for the destination:
   - Markdown: a `text` fenced block.
   - Source code: one comment prefix on every rendered line.
   - Plain text: insert it directly.
4. Preserve the original Mermaid source when it remains useful to edit the
   diagram later; rendered Unicode art is not a maintainable diagram format.

Do not claim that this creates an image, data URI, SVG, or PNG. For those
formats, use a dedicated Mermaid SVG/PNG renderer instead.
