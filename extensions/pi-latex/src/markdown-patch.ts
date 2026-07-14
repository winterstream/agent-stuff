const PATCH_STATE = Symbol.for("pi-latex.markdown-renderer.v1");

type MarkdownToken = { type?: string; lang?: string; text?: string; tokens?: any[] };
type RenderToken = (this: MarkdownInstance, token: MarkdownToken, width: number, nextTokenType?: string, styleContext?: unknown) => string[];
interface MarkdownInstance { theme?: unknown }
export interface MarkdownPrototype extends MarkdownInstance { renderToken?: RenderToken; [PATCH_STATE]?: PatchState }
type LatexRenderer = (source: string, width: number, theme: unknown) => string[];
type InlineLatexRenderer = (source: string, width: number, theme: unknown) => string;
interface OwnerState { render: LatexRenderer; renderInline: InlineLatexRenderer; reportedErrors: Set<string>; onError?: (error: Error) => void }
interface PatchState { original: RenderToken; wrapper: RenderToken; owners: Map<symbol, OwnerState> }

/** Replace supported math delimiters inside Markdown's nested inline text tokens. */
export function replaceMathDelimiters(source: string, render: InlineLatexRenderer, width: number, theme: unknown): string {
  return source.replace(/\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|(?<!\\)\$\$([\s\S]*?)\$\$|(?<!\\)\$([^$\n]+?)\$/g, (_match, display, inline, dollarDisplay, dollarInline) => render(display ?? inline ?? dollarDisplay ?? dollarInline, width, theme));
}

function transformInlineToken(token: MarkdownToken, owner: OwnerState, width: number, theme: unknown): void {
  if (token.type === "code") return;
  if (typeof token.text === "string") token.text = replaceMathDelimiters(token.text, owner.renderInline, width, theme);
  if (Array.isArray(token.tokens)) for (const child of token.tokens) transformInlineToken(child, owner, width, theme);
}

function isLatexLanguage(language: string | undefined): boolean {
  return ["latex", "tex", "math"].includes(language?.trim().split(/\s+/, 1)[0]?.toLowerCase() ?? "");
}

/** Patches Pi's display seam only; session content and model context remain TeX. */
export function installMarkdownPatch(prototype: MarkdownPrototype, render: LatexRenderer, renderInline: InlineLatexRenderer, onError?: (error: Error) => void): () => void {
  const owner = Symbol("pi-latex-owner");
  let state = prototype[PATCH_STATE];
  if (!state) {
    if (typeof prototype.renderToken !== "function") throw new Error("Unsupported Pi TUI: Markdown.renderToken() was not found");
    const original = prototype.renderToken;
    state = { original, owners: new Map(), wrapper: undefined as unknown as RenderToken };
    state.wrapper = function (token, width, nextTokenType, styleContext) {
      const active = Array.from(state!.owners.values()).at(-1);
      if (!active) return state!.original.call(this, token, width, nextTokenType, styleContext);
      try {
        if (token.type !== "code" || !isLatexLanguage(token.lang) || !token.text?.trim()) {
          transformInlineToken(token, active, Math.max(1, width), this.theme);
          return state!.original.call(this, token, width, nextTokenType, styleContext);
        }
        const lines = active.render(token.text, Math.max(1, width), this.theme);
        if (lines.length === 0) return state!.original.call(this, token, width, nextTokenType, styleContext);
        if (nextTokenType && nextTokenType !== "space") lines.push("");
        return lines;
      } catch (error) {
        const normalized = error instanceof Error ? error : new Error(String(error));
        if (!active.reportedErrors.has(normalized.message)) {
          active.reportedErrors.add(normalized.message);
          active.onError?.(normalized);
        }
        return state!.original.call(this, token, width, nextTokenType, styleContext);
      }
    };
    Object.defineProperty(prototype, PATCH_STATE, { configurable: true, value: state });
    prototype.renderToken = state.wrapper;
  }
  state.owners.set(owner, { render, renderInline, reportedErrors: new Set(), onError });
  return () => {
    state?.owners.delete(owner);
    if (state?.owners.size === 0) {
      if (prototype.renderToken === state.wrapper) prototype.renderToken = state.original;
      delete prototype[PATCH_STATE];
    }
  };
}
