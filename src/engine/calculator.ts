import { evaluate, format, MathError, type Op, type Token } from './evaluate';

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
export type Key = Digit | '.' | Op | 'x²' | '=' | 'AC' | '⌫';

// After =, tokens is empty and result holds the answer; shown keeps the sum for the line above it.
export type Calc = Readonly<{ tokens: readonly Token[]; result: string | null; shown: string; error: string | null }>;
type Stats = { operators: number; hard: boolean; value: number };
export type Outcome = { state: Calc; event: 'typed' | 'ignored' | 'result' | 'error' | 'cleared'; stats?: Stats };

export const EMPTY: Calc = { tokens: [], result: null, shown: '', error: null };

const MAX_DIGITS = 15;
const MESSAGES: Record<MathError['reason'], string> = {
  'divide-by-zero': 'Can’t divide by zero. Your number is kept.',
  'too-big': 'Too big to show. Your sum is kept.',
};

const num = (text: string): Token => ({ kind: 'num', text });
const op = (sign: Op): Token => ({ kind: 'op', op: sign });
const sign = (text: string) => text.replace('-', '−');
const isDigit = (key: Key): key is Digit => /^\d$/.test(key);
const isOp = (key: Key): key is Op => key === '+' || key === '−' || key === '×' || key === '÷';

const typed = (tokens: readonly Token[]): Outcome => ({ state: { ...EMPTY, tokens }, event: 'typed' });
const ignored = (state: Calc): Outcome => ({ state, event: 'ignored' });

export function press(state: Calc, key: Key): Outcome {
  if (key === 'AC') return { state: EMPTY, event: 'cleared' };
  if (state.result !== null) return continueFrom(state, state.result, key);
  return edit(state, key);
}

function continueFrom(state: Calc, result: string, key: Key): Outcome {
  if (isDigit(key)) return typed([num(key)]);
  if (key === '.') return typed([num('0.')]);
  if (isOp(key)) return typed([num(result), op(key)]);
  if (key === 'x²') return typed([num(result), { kind: 'sq' }]);
  if (key === '⌫') {
    const shorter = result.includes('e') ? '' : result.slice(0, -1);
    return typed(shorter === '' || shorter === '-' ? [] : [num(shorter)]);
  }
  return ignored(state);
}

function edit(state: Calc, key: Key): Outcome {
  const tokens = state.tokens;
  const last = tokens.at(-1);
  const head = tokens.slice(0, -1);
  const pendingMinus = last?.kind === 'num' && last.text === '-';

  if (isDigit(key)) {
    if (last?.kind === 'sq') return ignored(state);
    if (last?.kind !== 'num') return typed([...tokens, num(key)]);
    if (last.text.includes('e') || last.text.replace(/\D/g, '').length >= MAX_DIGITS) return ignored(state);
    if (last.text === '0') return typed([...head, num(key)]);
    if (last.text === '-0') return typed([...head, num(`-${key}`)]);
    return typed([...head, num(last.text + key)]);
  }

  if (key === '.') {
    if (last?.kind === 'sq') return ignored(state);
    if (last?.kind !== 'num') return typed([...tokens, num('0.')]);
    if (last.text.includes('.') || last.text.includes('e')) return ignored(state);
    return typed([...head, num(pendingMinus ? '-0.' : `${last.text}.`)]);
  }

  if (key === '−') {
    if (!last) return typed([num('-')]);
    if (pendingMinus) return ignored(state);
    if (last.kind === 'op') {
      // After × or ÷ a minus starts a negative number; after + or − it replaces the operator.
      if (last.op === '×' || last.op === '÷') return typed([...tokens, num('-')]);
      return last.op === '−' ? ignored(state) : typed([...head, op('−')]);
    }
    return typed([...tokens, op('−')]);
  }

  if (isOp(key)) {
    if (!last) return ignored(state);
    if (pendingMinus) return typed(head.length === 0 ? [] : [...head.slice(0, -1), op(key)]);
    if (last.kind === 'op') return last.op === key ? ignored(state) : typed([...head, op(key)]);
    return typed([...tokens, op(key)]);
  }

  // One square per number: a second would read as a higher power (5²² looks like 5 to the 22nd). = then x² squares again.
  if (key === 'x²') {
    if (!last || last.kind === 'op' || last.kind === 'sq' || pendingMinus) return ignored(state);
    return typed([...tokens, { kind: 'sq' }]);
  }

  if (key === '⌫') {
    if (!last) return ignored(state);
    if (last.kind === 'num' && last.text.length > 1 && !last.text.includes('e')) return typed([...head, num(last.text.slice(0, -1))]);
    return typed(head);
  }

  return equals(state);
}

function equals(state: Calc): Outcome {
  const tokens = state.tokens;
  const last = tokens.at(-1);
  const operators = tokens.filter((token) => token.kind === 'op').length;
  const squared = tokens.some((token) => token.kind === 'sq');
  const unfinished = !last || last.kind === 'op' || (last.kind === 'num' && last.text === '-');
  if (unfinished || (operators === 0 && !squared)) return ignored(state);

  try {
    const result = format(evaluate(tokens));
    const hard = squared || tokens.some((token) => token.kind === 'op' && token.op === '÷');
    return {
      state: { tokens: [], result, shown: expressionOf(tokens), error: null },
      event: 'result',
      stats: { operators, hard, value: Number(result) },
    };
  } catch (error) {
    if (!(error instanceof MathError)) throw error;
    return { state: { ...EMPTY, tokens, error: MESSAGES[error.reason] }, event: 'error' };
  }
}

const expressionOf = (tokens: readonly Token[]) =>
  tokens
    .map((token) => (token.kind === 'num' ? ` ${sign(token.text)}` : token.kind === 'sq' ? '²' : ` ${token.op}`))
    .join('')
    .trim();

// The big number: the last number typed, with its squares; the one before an operator while the next is awaited.
function current(tokens: readonly Token[]): string {
  let index = tokens.length - 1;
  while (index >= 0 && tokens[index].kind === 'op') index -= 1;
  let squares = 0;
  while (index >= 0 && tokens[index].kind === 'sq') {
    squares += 1;
    index -= 1;
  }
  const token = tokens[index];
  return token?.kind === 'num' ? sign(token.text) + '²'.repeat(squares) : '0';
}

export function view(state: Calc): { expression: string; main: string; error: string | null } {
  if (state.result !== null) return { expression: `${state.shown} =`, main: sign(state.result), error: null };
  const lone = state.tokens.length === 1 && state.tokens[0].kind === 'num';
  return { expression: lone ? '' : expressionOf(state.tokens), main: state.error ? '—' : current(state.tokens), error: state.error };
}
