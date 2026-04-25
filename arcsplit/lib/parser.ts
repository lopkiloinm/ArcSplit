// ─── Expression Parser ────────────────────────────────────────────────────────
// Recursive descent parser. No eval(). Supports +, -, *, /, parentheses,
// integers, decimals, and whitespace. Builds an explicit AST with node IDs.

import { ASTNode, BinaryNode, LiteralNode, OperatorType } from "./types";

let nodeCounter = 0;

function freshId(prefix: string): string {
  return `${prefix}_${++nodeCounter}`;
}

// Reset counter so IDs are deterministic per parse call
function resetCounter() {
  nodeCounter = 0;
}

// ─── Tokenizer ────────────────────────────────────────────────────────────────

type TokenType = "NUMBER" | "PLUS" | "MINUS" | "STAR" | "SLASH" | "LPAREN" | "RPAREN" | "EOF";

interface Token {
  type: TokenType;
  value: string;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    // Skip whitespace
    if (/\s/.test(ch)) { i++; continue; }

    // Numbers (integers and decimals)
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(input[i + 1] ?? ""))) {
      let num = "";
      while (i < input.length && /[0-9.]/.test(input[i])) {
        num += input[i++];
      }
      tokens.push({ type: "NUMBER", value: num });
      continue;
    }

    switch (ch) {
      case "+": tokens.push({ type: "PLUS", value: "+" }); break;
      case "-": tokens.push({ type: "MINUS", value: "-" }); break;
      case "*": tokens.push({ type: "STAR", value: "*" }); break;
      case "/": tokens.push({ type: "SLASH", value: "/" }); break;
      case "(": tokens.push({ type: "LPAREN", value: "(" }); break;
      case ")": tokens.push({ type: "RPAREN", value: ")" }); break;
      default:
        throw new Error(`Unexpected character: '${ch}' at position ${i}`);
    }
    i++;
  }

  tokens.push({ type: "EOF", value: "" });
  return tokens;
}

// ─── Recursive Descent Parser ─────────────────────────────────────────────────
// Grammar:
//   expr   → term (('+' | '-') term)*
//   term   → factor (('*' | '/') factor)*
//   factor → NUMBER | '(' expr ')'

class Parser {
  private tokens: Token[];
  private pos: number = 0;
  private depth: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: TokenType): Token {
    const tok = this.consume();
    if (tok.type !== type) {
      throw new Error(`Expected ${type} but got ${tok.type} ('${tok.value}')`);
    }
    return tok;
  }

  parse(): ASTNode {
    const node = this.parseExpr();
    if (this.peek().type !== "EOF") {
      throw new Error(`Unexpected token: '${this.peek().value}'`);
    }
    return node;
  }

  // Addition and subtraction (lowest precedence)
  private parseExpr(): ASTNode {
    let left = this.parseTerm();

    while (this.peek().type === "PLUS" || this.peek().type === "MINUS") {
      const op = this.consume();
      const operator: OperatorType = op.type === "PLUS" ? "add" : "subtract";
      const right = this.parseTerm();
      const node: BinaryNode = {
        id: freshId("op"),
        type: "binary",
        operator,
        left,
        right,
        depth: this.depth,
      };
      left = node;
    }

    return left;
  }

  // Multiplication and division (higher precedence)
  private parseTerm(): ASTNode {
    let left = this.parseFactor();

    while (this.peek().type === "STAR" || this.peek().type === "SLASH") {
      const op = this.consume();
      const operator: OperatorType = op.type === "STAR" ? "multiply" : "divide";
      const right = this.parseFactor();
      const node: BinaryNode = {
        id: freshId("op"),
        type: "binary",
        operator,
        left,
        right,
        depth: this.depth,
      };
      left = node;
    }

    return left;
  }

  // Literals and parenthesized expressions
  private parseFactor(): ASTNode {
    const tok = this.peek();

    if (tok.type === "NUMBER") {
      this.consume();
      const node: LiteralNode = {
        id: freshId("lit"),
        type: "literal",
        value: parseFloat(tok.value),
      };
      return node;
    }

    if (tok.type === "LPAREN") {
      this.consume();
      this.depth++;
      const inner = this.parseExpr();
      this.expect("RPAREN");
      this.depth--;
      return inner;
    }

    // Handle unary minus
    if (tok.type === "MINUS") {
      this.consume();
      const operand = this.parseFactor();
      const zero: LiteralNode = { id: freshId("lit"), type: "literal", value: 0 };
      const node: BinaryNode = {
        id: freshId("op"),
        type: "binary",
        operator: "subtract",
        left: zero,
        right: operand,
        depth: this.depth,
      };
      return node;
    }

    throw new Error(`Unexpected token: '${tok.value}' (${tok.type})`);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function parseExpression(expression: string): ASTNode {
  resetCounter();
  const tokens = tokenize(expression.trim());
  const parser = new Parser(tokens);
  return parser.parse();
}

// Count operations by type via tree traversal
export function countOperations(node: ASTNode): Record<OperatorType, number> {
  const counts: Record<OperatorType, number> = {
    add: 0,
    subtract: 0,
    multiply: 0,
    divide: 0,
  };

  function traverse(n: ASTNode) {
    if (n.type === "binary") {
      counts[n.operator]++;
      traverse(n.left);
      traverse(n.right);
    }
  }

  traverse(node);
  return counts;
}

// Validate expression string (basic sanity check before parsing)
export function validateExpression(expression: string): { valid: boolean; error?: string } {
  if (!expression || expression.trim().length === 0) {
    return { valid: false, error: "Expression is empty" };
  }

  // Check for balanced parentheses
  let depth = 0;
  for (const ch of expression) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (depth < 0) return { valid: false, error: "Unbalanced parentheses" };
  }
  if (depth !== 0) return { valid: false, error: "Unbalanced parentheses" };

  // Check for invalid characters
  if (/[^0-9\s\+\-\*\/\.\(\)]/.test(expression)) {
    return { valid: false, error: "Invalid characters in expression" };
  }

  return { valid: true };
}
