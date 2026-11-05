import { describe, expect, it } from 'vitest';
import { createQueue } from './queue';

describe('createQueue', () => {
  it('shows one item at a time, in order', () => {
    const shown: string[] = [];
    let finish = () => {};
    const queue = createQueue<string>((item, done) => {
      shown.push(item);
      finish = done;
    });
    queue.push('first', 'second');
    expect(shown).toEqual(['first']);
    finish();
    expect(shown).toEqual(['first', 'second']);
  });

  it('waits for the item on screen before showing one pushed later', () => {
    const shown: string[] = [];
    let finish = () => {};
    const queue = createQueue<string>((item, done) => {
      shown.push(item);
      finish = done;
    });
    queue.push('first');
    queue.push('later');
    expect(shown).toEqual(['first']);
    finish();
    expect(shown).toEqual(['first', 'later']);
  });

  it('starts again after it has emptied', () => {
    const shown: string[] = [];
    const queue = createQueue<string>((item, done) => {
      shown.push(item);
      done();
    });
    queue.push('one');
    queue.push();
    queue.push('two');
    expect(shown).toEqual(['one', 'two']);
  });
});
