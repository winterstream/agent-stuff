const COMMANDS = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ϵ",
  zeta: "ζ", eta: "η", theta: "θ", vartheta: "ϑ", iota: "ι", kappa: "κ",
  lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", pi: "π", rho: "ρ", sigma: "σ",
  tau: "τ", upsilon: "υ", phi: "ϕ", varphi: "φ", chi: "χ", psi: "ψ", omega: "ω",
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π", Sigma: "Σ",
  Upsilon: "Υ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
  cdot: "·", times: "×", div: "÷", pm: "±", mp: "∓", minus: "−", plusminus: "±",
  le: "≤", leq: "≤", ge: "≥", geq: "≥", neq: "≠", ne: "≠", approx: "≈", sim: "∼",
  equiv: "≡", propto: "∝", infty: "∞", partial: "∂", nabla: "∇", ell: "ℓ",
  sum: "∑", prod: "∏", int: "∫", iint: "∬", oint: "∮", sqrt: "√",
  to: "→", rightarrow: "→", leftarrow: "←", leftrightarrow: "↔", mapsto: "↦",
  implies: "⇒", iff: "⇔", in: "∈", notin: "∉", subset: "⊂", subseteq: "⊆",
  superset: "⊃", superseteq: "⊇", cup: "∪", cap: "∩", forall: "∀", exists: "∃",
  land: "∧", lor: "∨", neg: "¬", degree: "°", percent: "%", ldots: "…", cdots: "⋯",
  quad: "  ", qquad: "    ", space: " ", thinspace: " ", enspace: " ",
};

const SUPERSCRIPT = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", i: "ⁱ", n: "ⁿ", a: "ᵃ", b: "ᵇ", c: "ᶜ", d: "ᵈ", e: "ᵉ", f: "ᶠ", g: "ᵍ", h: "ʰ", j: "ʲ", k: "ᵏ", l: "ˡ", m: "ᵐ", o: "ᵒ", p: "ᵖ", r: "ʳ", s: "ˢ", t: "ᵗ", u: "ᵘ", v: "ᵛ", w: "ʷ", x: "ˣ", y: "ʸ", z: "ᶻ",
  α: "ᵅ", β: "ᵝ", γ: "ᵞ", δ: "ᵟ", θ: "ᶿ", φ: "ᵠ", χ: "ᵡ",
};

const SUBSCRIPT = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎", a: "ₐ", e: "ₑ", h: "ₕ", i: "ᵢ", j: "ⱼ", k: "ₖ", l: "ₗ", m: "ₘ", n: "ₙ", o: "ₒ", p: "ₚ", r: "ᵣ", s: "ₛ", t: "ₜ", u: "ᵤ", v: "ᵥ", x: "ₓ", β: "ᵦ", γ: "ᵧ", ρ: "ᵨ", φ: "ᵩ", χ: "ᵪ",
};

function styled(text, table, bracket) {
  if (text.length === 1 && table[text]) return table[text];
  const converted = [...text].map((char) => table[char] ?? char).join("");
  return `${bracket[0]}${converted}${bracket[1]}`;
}

class Parser {
  offset = 0;

  constructor(source) { this.source = source; }

  render() {
    const result = this.expression();
    return result
      .replace(/\s+/g, " ")
      .replace(/\s*([=×·÷≤≥≠≈→←↔])\s*/g, " $1 ")
      .replace(/\s+\+\s+/g, " + ")
      .replace(/\s+-\s+/g, " − ")
      .replace(/ {2,}/g, " ")
      .trim();
  }

  expression(until) {
    let output = "";
    while (this.offset < this.source.length) {
      const char = this.source[this.offset];
      if (until && char === until) {
        this.offset++;
        break;
      }
      if (char === "{") {
        this.offset++;
        output += this.expression("}");
      } else if (char === "\\") {
        output += this.command();
      } else if (char === "^" || char === "_") {
        this.offset++;
        const value = this.argument();
        output += char === "^"
          ? styled(value, SUPERSCRIPT, ["⁽", "⁾"])
          : styled(value, SUBSCRIPT, ["₍", "₎"]);
      } else if (char === "~") {
        this.offset++;
        output += " ";
      } else if (char === "\n" || char === "\r") {
        this.offset++;
        output += " ";
      } else {
        this.offset++;
        output += char;
      }
    }
    return output;
  }

  command() {
    this.offset++; // slash
    const match = /^[A-Za-z]+/.exec(this.source.slice(this.offset));
    if (!match) {
      const char = this.source[this.offset++] ?? "";
      return { " ": " ", ",": " ", ";": " ", "!": "", "[": "", "]": "", "{": "{", "}": "}" }[char] ?? char;
    }

    const name = match[0];
    this.offset += name.length;
    if (name === "text" || name === "mathrm" || name === "operatorname") return this.argument();
    if (name === "mathbb") return this.blackboard(this.argument());
    if (name === "mathbf" || name === "mathit" || name === "mathsf" || name === "mathtt") return this.argument();
    if (name === "frac" || name === "dfrac" || name === "tfrac") {
      const numerator = this.argument();
      const denominator = this.argument();
      return `(${numerator})⁄(${denominator})`;
    }
    if (name === "sqrt") {
      if (this.source[this.offset] === "[") this.argument("[");
      return `√(${this.argument()})`;
    }
    if (name === "left" || name === "right") {
      this.skipWhitespace();
      if (this.source[this.offset] === "\\") return this.command();
      return this.source[this.offset++] ?? "";
    }
    if (name === "begin" || name === "end") {
      this.argument();
      return name === "begin" ? "" : " ";
    }
    return COMMANDS[name] ?? `\\${name}`;
  }

  argument(delimiter = "{") {
    this.skipWhitespace();
    if (this.source[this.offset] === delimiter) {
      this.offset++;
      return this.expression(delimiter === "{" ? "}" : "]");
    }
    if (this.source[this.offset] === "\\") return this.command();
    return this.source[this.offset++] ?? "";
  }

  skipWhitespace() {
    while (/\s/.test(this.source[this.offset] ?? "")) this.offset++;
  }

  blackboard(value) {
    const map = {
      C: "ℂ", H: "ℍ", N: "ℕ", P: "ℙ", Q: "ℚ", R: "ℝ", Z: "ℤ",
      "1": "𝟙", "0": "𝟘",
    };
    return [...value].map((char) => map[char] ?? char).join("");
  }
}

/** Convert a useful, deliberately non-layout subset of TeX math to Unicode text. */
export function latexToUnicode(source) {
  return new Parser(source.replace(/\$\$/g, "").replace(/\$/g, "")).render();
}
