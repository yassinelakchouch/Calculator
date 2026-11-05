// One item on screen at a time: `show` gets the next item and calls `done` once it has left.
export function createQueue<T>(show: (item: T, done: () => void) => void) {
  const waiting: T[] = [];
  let busy = false;
  const next = () => {
    const item = waiting.shift();
    busy = item !== undefined;
    if (item !== undefined) show(item, next);
  };
  return {
    push(...items: T[]) {
      waiting.push(...items);
      if (!busy) next();
    },
  };
}
