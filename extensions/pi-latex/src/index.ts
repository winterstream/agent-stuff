import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Markdown, type MarkdownTheme } from "@earendil-works/pi-tui";
import { Type } from "typebox";

import { latexToUnicode } from "./latex-to-unicode.js";
import { installMarkdownPatch, type MarkdownPrototype } from "./markdown-patch.js";

function wrap(text: string, width: number): string[] {
  if (text.length <= width) return [text];
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line && line.length + word.length + 1 > width) {
      lines.push(line);
      line = word;
    } else {
      line += `${line ? " " : ""}${word}`;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export default function piLatex(pi: ExtensionAPI): void {
  let uninstall: (() => void) | undefined;

  pi.registerTool({
    name: "render_latex",
    label: "Render LaTeX",
    description: "Convert a practical subset of LaTeX math into portable Unicode text for terminal output and documentation.",
    promptSnippet: "Convert LaTeX formulas to Unicode text suitable for documentation",
    promptGuidelines: ["Use render_latex when the user wants a LaTeX formula exported as portable Unicode text."],
    parameters: Type.Object({ formula: Type.String({ description: "LaTeX or TeX math source" }) }),
    async execute(_id, { formula }) {
      const text = latexToUnicode(formula);
      return { content: [{ type: "text", text }], details: { source: formula, text } };
    },
  });

  pi.on("session_start", (_event, ctx) => {
    if (ctx.mode !== "tui" || uninstall) return;
    try {
      uninstall = installMarkdownPatch(
        Markdown.prototype as unknown as MarkdownPrototype,
        (source, width, theme) => wrap(latexToUnicode(source), width).map((line) => (theme as MarkdownTheme).codeBlock(line)),
        (source) => latexToUnicode(source),
        (error) => ctx.ui.notify(`LaTeX rendering failed; showing source: ${error.message}`, "warning"),
      );
    } catch (error) {
      ctx.ui.notify(`pi-latex disabled: ${error instanceof Error ? error.message : String(error)}`, "error");
    }
  });

  pi.on("session_shutdown", () => {
    uninstall?.();
    uninstall = undefined;
  });
}
