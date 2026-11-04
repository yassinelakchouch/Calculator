export type Op = '+' | '−' | '×' | '÷';
export type Token = { kind: 'num'; text: string } | { kind: 'op'; op: Op } | { kind: 'sq' };

export class MathError extends Error {
  constructor(readonly reason: 'divide-by-zero' | 'too-big') {
    super(reason);
  }
}

const PRECEDENCE: Record<Op, number> = { '+': 1, '−': 1, '×': 2, '÷': 2 };

// Shunting-yard without eval: ² binds tightest, so it applies to the value just read.
export function evaluate(tokens: readonly Token[]): number {
  const values: number[] = [];
  const ops: Op[] = [];
  const apply = () => {
    const op = ops.pop()!;
    const right = values.pop()!;
    const left = values.pop()!;
    if (op === '÷' && right === 0) throw new MathError('divide-by-zero');
    if (op === '+') values.push(left + right);
    else if (op === '−') values.push(left - right);
    else if (op === '×') values.push(left * right);
    else values.push(left / right);
  };

  for (const token of tokens) {
    if (token.kind === 'num') values.push(Number(token.text));
    else if (token.kind === 'sq') values.push(values.pop()! ** 2);
    else {
      while (ops.length > 0 && PRECEDENCE[ops[ops.length - 1]] >= PRECEDENCE[token.op]) apply();
      ops.push(token.op);
    }
  }
  while (ops.length > 0) apply();

  const value = values[0];
  if (!Number.isFinite(value)) throw new MathError('too-big');
  return value;
}

// 12 significant digits hide float noise (0.1 + 0.2); e-notation past 15 digits or below 1e-9.
export function format(value: number): string {
  const rounded = Number(value.toPrecision(12));
  if (rounded === 0) return '0';
  const size = Math.abs(rounded);
  return size >= 1e15 || size < 1e-9 ? rounded.toExponential().replace('e+', 'e') : String(rounded);
}
