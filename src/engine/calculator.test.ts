import { describe, expect, test } from 'vitest';
import { EMPTY, press, view, type Key, type Outcome } from './calculator';

// "0.1 + 0.2 =" → the keys 0 . 1 + 0 . 2 =; multi-character keys (x², AC) stay whole.
const keysOf = (sequence: string): Key[] =>
  sequence
    .split(' ')
    .filter(Boolean)
    .flatMap((part) => (/^[\d.]+$/.test(part) ? [...part] : [part])) as Key[];

const run = (sequence: string) => {
  let outcome: Outcome = { state: EMPTY, event: 'ignored' };
  for (const key of keysOf(sequence)) outcome = press(outcome.state, key);
  return { ...outcome, ...view(outcome.state) };
};

describe('typing numbers', () => {
  test('leading zeros collapse', () => expect(run('0 0 7').main).toBe('7'));
  test('a dot first reads as 0.', () => expect(run('. 5').main).toBe('0.5'));
  test('a second dot in the same number is ignored', () => expect(run('1 . 2 . 3').main).toBe('1.23'));
  test('a number holds 15 digits; the 16th is ignored', () => {
    const outcome = run('1234567890123456');
    expect(outcome.main).toBe('123456789012345');
    expect(outcome.event).toBe('ignored');
  });
  test('a lone number shows no expression line above it', () => expect(run('4 2')).toMatchObject({ main: '42', expression: '' }));
  test('⌫ removes the last digit', () => expect(run('1 2 ⌫').main).toBe('1'));
  test('AC clears everything', () => expect(run('7 × 8 AC')).toMatchObject({ main: '0', expression: '' }));
});

describe('operators', () => {
  test('× and ÷ come before + and −', () => expect(run('2 + 3 × 4 =').main).toBe('14'));
  test('the same level runs left to right', () => {
    expect(run('8 − 3 − 2 =').main).toBe('3');
    expect(run('16 ÷ 4 ÷ 2 =').main).toBe('2');
  });
  test('a second operator replaces the first', () => expect(run('5 + × 2 =').main).toBe('10'));
  test('− after × starts a negative number', () => expect(run('5 × − 3 =').main).toBe('−15'));
  test('a pending minus then + replaces the operator before it', () => expect(run('5 × − +').expression).toBe('5 +'));
  test('an operator with nothing before it is ignored', () => expect(run('+').event).toBe('ignored'));
  test('a lone minus then + leaves nothing', () => expect(run('− +')).toMatchObject({ main: '0', expression: '' }));
  test('the expression line shows typographic signs', () => expect(run('7 × 8').expression).toBe('7 × 8'));
  test('a trailing dot is a whole number', () => expect(run('5 . + 1 =').main).toBe('6'));
});

describe('x²', () => {
  test('squares the number before it', () => expect(run('3 x² + 1 =').main).toBe('10'));
  test('the minus belongs to the number', () => expect(run('− 4 x² =').main).toBe('16'));
  test('x² with nothing before it is ignored', () => expect(run('x²').event).toBe('ignored'));
  test('a digit right after x² is ignored', () => expect(run('3 x² 4').expression).toBe('3²'));
  test('it reads as a superscript', () => expect(run('3 x² + 1').expression).toBe('3² + 1'));
  // The owner's report: x² pressed again kept stacking, 5²²²²²²² read as a power it never computed.
  test('a second x² on the same number is ignored, so 5²² never appears', () => {
    const outcome = run('5 x² x² x²');
    expect(outcome.event).toBe('ignored');
    expect(outcome.main).toBe('5²');
  });
  test('= then x² squares again', () => expect(run('5 x² = x² =').main).toBe('625'));
  test('x² after a closed bracket of work still squares only the last number', () => expect(run('2 + 3 x² x² =').main).toBe('11'));
});

describe('results', () => {
  test('0.1 + 0.2 is 0.3', () => expect(run('0.1 + 0.2 =')).toMatchObject({ main: '0.3', expression: '0.1 + 0.2 =' }));
  test('1 ÷ 3 keeps 12 significant digits', () => expect(run('1 ÷ 3 =').main).toBe('0.333333333333'));
  test('2 ÷ 3 rounds the last digit', () => expect(run('2 ÷ 3 =').main).toBe('0.666666666667'));
  test('big results switch to e-notation', () => expect(run('99999999 × 99999999 =').main).toBe('9.9999998e15'));
  test('minus zero shows as 0', () => expect(run('0 × − 1 =').main).toBe('0'));
  test('an unfinished sum is not a result', () => {
    const outcome = run('5 + =');
    expect(outcome.event).toBe('ignored');
    expect(outcome.expression).toBe('5 +');
  });
  test('a lone number is not a result', () => expect(run('7 =').event).toBe('ignored'));
  test('= again after a result changes nothing', () => {
    const outcome = run('7 × 8 = =');
    expect(outcome.event).toBe('ignored');
    expect(outcome.main).toBe('56');
  });
  test('an operator continues from the result', () => expect(run('7 × 8 = + 2 =').main).toBe('58'));
  test('a negative result continues', () => expect(run('2 − 5 = × 3 =').main).toBe('−9'));
  test('a digit starts fresh', () => expect(run('7 × 8 = 4')).toMatchObject({ main: '4', expression: '' }));
  test('a dot starts fresh at 0.', () => expect(run('7 × 8 = .').main).toBe('0.'));
  test('⌫ turns the result into the number you edit', () => expect(run('7 × 8 = ⌫').main).toBe('5'));
  test('x² squares the result', () => expect(run('7 × 8 = x² =').main).toBe('3136'));
});

describe('errors keep your number', () => {
  test('dividing by zero says why', () => {
    const outcome = run('8 ÷ 0 =');
    expect(outcome.event).toBe('error');
    expect(outcome.error).toBe('Can’t divide by zero. Your number is kept.');
    expect(outcome.expression).toBe('8 ÷ 0');
  });
  test('⌫ after the error removes the 0', () => expect(run('8 ÷ 0 = ⌫')).toMatchObject({ expression: '8 ÷', error: null }));
  test('a digit after the error replaces the 0', () => expect(run('8 ÷ 0 = 4 =').main).toBe('2'));
  test('a result too big to show says so', () => {
    const outcome = run('999999999999999 x² = x² = x² = x² = x² =');
    expect(outcome.event).toBe('error');
    expect(outcome.error).toBe('Too big to show. Your sum is kept.');
  });
});

describe('what a result is worth', () => {
  test('one operator', () => expect(run('7 × 8 =').stats).toEqual({ operators: 1, hard: false, value: 56 }));
  test('two operators', () => expect(run('1 + 2 + 3 =').stats).toEqual({ operators: 2, hard: false, value: 6 }));
  test('÷ is hard', () => expect(run('8 ÷ 2 =').stats).toMatchObject({ hard: true }));
  test('x² is hard', () => expect(run('3 x² =').stats).toMatchObject({ hard: true, value: 9 }));
});

describe('what the display can hold', () => {
  test('a number left as 5. is finished as 5 once an operator follows', () => expect(run('5 . + 2').expression).toBe('5 + 2'));
  test('0. then × reads 0 ×, and the sum still works', () => expect(run('0 . × 3 =')).toMatchObject({ main: '0', expression: '0 × 3 =' }));
  test('long decimals keep to 16 characters', () => {
    for (const sum of ['1 ÷ 7 =', '− 2.09267042185 ÷ 1000000 =', '1 ÷ 3 − 1 =', '0.000001 ÷ 3 =']) expect(run(sum).main.length).toBeLessThanOrEqual(16);
  });
  test('the shortest exact answer is kept as it is', () => expect(run('1 ÷ 4 =').main).toBe('0.25'));
});
