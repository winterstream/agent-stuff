import assert from "node:assert/strict";
import test from "node:test";
import piLatex from "../src/index.ts";
import { replaceMathDelimiters } from "../src/markdown-patch.ts";

test("registers an agent-accessible Unicode export tool", async () => {
  let definition: any;
  const handlers = new Map<string, Function>();
  piLatex({
    registerTool(tool: unknown) { definition = tool; },
    on(event: string, handler: Function) { handlers.set(event, handler); },
  } as any);

  assert.equal(definition.name, "render_latex");
  assert.ok(handlers.has("session_start"));
  const result = await definition.execute("test", { formula: String.raw`\mu_i = \mathbb{1}_{5+}` });
  assert.equal(result.content[0].text, "μᵢ = 𝟙₍₅₊₎");
});

test("recognizes display and inline math delimiters without touching ordinary text", () => {
  const rendered = replaceMathDelimiters(
    String.raw`Euler: $e^{i\pi}+1=0$; display: \[\mu_j = \text{baseline}\]`,
    (source) => `[${source.trim()}]`,
    80,
    undefined,
  );
  assert.equal(rendered, "Euler: [e^{i\\pi}+1=0]; display: [\\mu_j = \\text{baseline}]");
});
