# pi-latex

A Pi extension that renders fenced `latex`, `tex`, and `math` blocks as portable Unicode in the terminal.

```latex
\[
\mu_i =
\text{baseline}
- \text{5+ uplift} \cdot \mathbb{1}_{5+}
- \text{area effect}_{area_i}
- \text{area-specific 5+ effect}_{area_i} \cdot \mathbb{1}_{5+}
\]
```

becomes:

```text
μᵢ = baseline − 5+ uplift · 𝟙₍₅₊₎ − area effect₍ₐᵣₑₐᵢ₎ − area-specific 5+ effect₍ₐᵣₑₐᵢ₎ · 𝟙₍₅₊₎
```

## Install

```bash
pi install .
# or, from a published repository:
# pi install git:github.com/<owner>/pi-latex
```

Restart Pi (or run `/reload`). Use fenced blocks with one of `latex`, `tex`, or `math`.

## Exporting formulas

The extension registers the `render_latex` tool. An agent can call it to get Unicode text it can put directly into Markdown, comments, or other documentation.

It also provides a dependency-free CLI that writes only rendered text to stdout:

```bash
# From this checkout (or a normal npm installation):
node bin/pi-latex.js '\\frac{\\alpha + 1}{\\sqrt{x}} \\leq \\infty'
# (α + 1)⁄(√(x)) ≤ ∞

printf '\\mu_i = \\mathbb{1}_{5+}' | node bin/pi-latex.js
# μᵢ = 𝟙₍₅₊₎
```

`pi install` loads extensions but does not add npm package binaries to your shell `PATH`. To install the `pi-latex` executable globally too, use `npm install -g .` from this checkout.

## Rendering policy

This is deliberately **not** a full TeX layout engine. It prioritizes copyable, readable Unicode:

- Greek letters, common relations/operators, arrows, set notation, `\mathbb`, `\text`, fractions, roots, scripts, and display delimiters are supported.
- Fractions are inline (`(a)⁄(b)`) and large operators remain Unicode (`∫`, `∑`); they do not become ASCII art by default.
- Inline math (`\(...\)` and `$...$`) and display math (`\[...\]` and `$$...$$`) are rendered inside normal Markdown paragraphs.
- When a result is wider than the Pi TUI code-block width, it wraps at whitespace into multiple Unicode lines.
- Unknown commands stay visible (for example `\unknown`) rather than being discarded.

## Prior art and rationale

- [KaTeX](https://katex.org/) is a fast, browser-oriented TeX typesetter, but its HTML/CSS layout is the wrong output format for a portable terminal transcript.
- [unified-latex](https://github.com/siefkenj/unified-latex) provides a JavaScript LaTeX AST and manipulation tooling. It is useful if this extension grows into broad TeX syntax support, but a full parser is unnecessarily large for terminal text conversion today.
- [asciiTeX](https://asciitex.sourceforge.net/) demonstrated command-line TeX-like equations rendered as copyable text. Its site says it is unmaintained and points to `libtexprintf`/`utftex`; its always-2D ASCII approach is intentionally not used here.

The renderer is small, dependency-free, and designed to fail safely: it patches Pi's display layer only. Assistant messages, session files, and model context retain the original LaTeX source; if rendering fails, Pi shows the normal fenced code block.

## Development

```bash
npm install
npm test
npm run check
```
