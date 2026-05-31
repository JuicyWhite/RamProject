// Safe formula evaluator — no eval(). Supports +, -, *, /, ^, (), named vars.

type Token =
  | { type: "NUM"; value: number }
  | { type: "ID"; name: string }
  | { type: "OP"; op: string }
  | { type: "LPAREN" | "RPAREN" };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/\d/.test(ch) || (ch === "." && /\d/.test(expr[i + 1] ?? ""))) {
      let num = "";
      while (i < expr.length && /[\d.]/.test(expr[i])) num += expr[i++];
      tokens.push({ type: "NUM", value: parseFloat(num) });
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let id = "";
      while (i < expr.length && /[A-Za-z_0-9]/.test(expr[i])) id += expr[i++];
      tokens.push({ type: "ID", name: id });
      continue;
    }
    if ("+-*/^".includes(ch)) {
      tokens.push({ type: "OP", op: ch });
      i++;
      continue;
    }
    if (ch === "(") { tokens.push({ type: "LPAREN" }); i++; continue; }
    if (ch === ")") { tokens.push({ type: "RPAREN" }); i++; continue; }
    throw new Error(`Unexpected character: ${ch}`);
  }
  return tokens;
}

// Recursive-descent parser → returns a compute function
type Env = Record<string, number>;

function parser(tokens: Token[]) {
  let pos = 0;

  function peek(): Token | undefined { return tokens[pos]; }
  function consume(): Token { return tokens[pos++]; }

  function parseExpr(): (env: Env) => number {
    return parseAddSub();
  }

  function parseAddSub(): (env: Env) => number {
    let left = parseMulDiv();
    while (peek()?.type === "OP" && (peek() as { op: string }).op.match(/[+-]/)) {
      const op = (consume() as { type: "OP"; op: string }).op;
      const right = parseMulDiv();
      const lc = left, rc = right;
      left = op === "+" ? (env) => lc(env) + rc(env) : (env) => lc(env) - rc(env);
    }
    return left;
  }

  function parseMulDiv(): (env: Env) => number {
    let left = parsePow();
    while (peek()?.type === "OP" && (peek() as { op: string }).op.match(/[*/]/)) {
      const op = (consume() as { type: "OP"; op: string }).op;
      const right = parsePow();
      const lc = left, rc = right;
      left = op === "*" ? (env) => lc(env) * rc(env) : (env) => {
        const d = rc(env);
        if (d === 0) throw new Error("Division by zero");
        return lc(env) / d;
      };
    }
    return left;
  }

  function parsePow(): (env: Env) => number {
    const base = parseUnary();
    if (peek()?.type === "OP" && (peek() as { op: string }).op === "^") {
      consume();
      const exp = parsePow();
      return (env) => Math.pow(base(env), exp(env));
    }
    return base;
  }

  function parseUnary(): (env: Env) => number {
    if (peek()?.type === "OP" && (peek() as { op: string }).op === "-") {
      consume();
      const operand = parsePrimary();
      return (env) => -operand(env);
    }
    return parsePrimary();
  }

  function parsePrimary(): (env: Env) => number {
    const tok = peek();
    if (!tok) throw new Error("Unexpected end of expression");

    if (tok.type === "NUM") {
      consume();
      const v = tok.value;
      return () => v;
    }
    if (tok.type === "ID") {
      consume();
      const name = tok.name;
      return (env) => {
        if (!(name in env)) throw new Error(`Unknown variable: ${name}`);
        return env[name];
      };
    }
    if (tok.type === "LPAREN") {
      consume();
      const inner = parseExpr();
      if (peek()?.type !== "RPAREN") throw new Error("Missing closing )");
      consume();
      return inner;
    }
    throw new Error(`Unexpected token: ${JSON.stringify(tok)}`);
  }

  return parseExpr();
}

export interface FormulaResult {
  value: number;
  error: null;
}
export interface FormulaError {
  value: null;
  error: string;
}

export function evaluateFormula(
  formula: string,
  variables: Record<string, number>
): FormulaResult | FormulaError {
  if (!formula.trim()) return { value: null as unknown as number, error: "Empty formula" };
  try {
    const tokens = tokenize(formula);
    const fn = parser(tokens);
    const result = fn(variables);
    if (!isFinite(result)) return { value: null as unknown as number, error: "Result is not finite" };
    return { value: result, error: null };
  } catch (e) {
    return { value: null as unknown as number, error: (e as Error).message };
  }
}

export function extractVariableNames(formula: string): string[] {
  try {
    const tokens = tokenize(formula);
    return [
      ...new Set(
        tokens.filter((t): t is { type: "ID"; name: string } => t.type === "ID").map((t) => t.name)
      ),
    ];
  } catch {
    return [];
  }
}
