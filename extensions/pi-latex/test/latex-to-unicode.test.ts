import assert from "node:assert/strict";
import test from "node:test";
import { latexToUnicode } from "../src/latex-to-unicode.js";

test("renders the requested model-effect formula as portable Unicode", () => {
  const source = String.raw`\[
    \mu_i = \text{baseline} - \text{5+ uplift} \cdot \mathbb{1}_{5+}
    - \text{area effect}_{area_i}
    - \text{area-specific 5+ effect}_{area_i} \cdot \mathbb{1}_{5+}
  \]`;
  assert.equal(
    latexToUnicode(source),
    "μᵢ = baseline − 5+ uplift · 𝟙₍₅₊₎ − area effect₍ₐᵣₑₐᵢ₎ − area-specific 5+ effect₍ₐᵣₑₐᵢ₎ · 𝟙₍₅₊₎",
  );
});

test("handles common symbols, fractions, roots, and display delimiters", () => {
  assert.equal(latexToUnicode(String.raw`\[\frac{\alpha + 1}{\sqrt{x}} \leq \infty\]`), "(α + 1)⁄(√(x)) ≤ ∞");
});

test("renders conditional bars as a mathematical relation", () => {
  assert.equal(latexToUnicode(String.raw`P(A\mid B)`), "P(A ∣ B)");
})

test("preserves unknown commands so formula meaning is never silently lost", () => {
  assert.equal(latexToUnicode(String.raw`\operatorname{log}(x) + \unknown`), "log(x) + \\unknown");
});
