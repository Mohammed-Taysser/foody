import { formatDeepDiff } from '../../../src/utils/deep-diff.utils';

describe('format-deep-diff', () => {
  it('returns an empty object when there are no differences', () => {
    const oldData = { name: 'John', age: 30 };
    const newData = { name: 'John', age: 30 };

    const result = formatDeepDiff(oldData, newData);
    expect(result).toEqual({});
  });

  it('detects updated fields', () => {
    const oldData = { name: 'John' };
    const newData = { name: 'Jane' };

    const result = formatDeepDiff(oldData, newData);
    expect(result).toEqual({
      name: {
        before: 'John',
        after: 'Jane',
        kind: 'update',
      },
    });
  });

  it('detects new fields', () => {
    const oldData = {};
    const newData = { name: 'Jane' };

    const result = formatDeepDiff(oldData, newData);
    expect(result).toEqual({
      name: {
        before: null,
        after: 'Jane',
        kind: 'add',
      },
    });
  });

  it('detects removed fields', () => {
    const oldData = { name: 'John' };
    const newData = {};

    const result = formatDeepDiff(oldData, newData);
    expect(result).toEqual({
      name: {
        before: 'John',
        after: null,
        kind: 'remove',
      },
    });
  });

  it('ignores excluded fields', () => {
    const oldData = { name: 'John', updatedAt: 'yesterday' };
    const newData = { name: 'Jane', updatedAt: 'today' };

    const result = formatDeepDiff(oldData, newData);
    expect(result).toEqual({
      name: {
        before: 'John',
        after: 'Jane',
        kind: 'update',
      },
    });
  });

  it('handles array changes', () => {
    const oldData = { items: ['apple'] };
    const newData = { items: ['apple', 'banana'] };

    const result = formatDeepDiff(oldData, newData);
    expect(result).toEqual({
      'items[1]': {
        before: null,
        after: 'banana',
        kind: 'add',
      },
    });
  });

  it('handles nested changes', () => {
    const oldData = { user: { name: 'John' } };
    const newData = { user: { name: 'Jane' } };

    const result = formatDeepDiff(oldData, newData);
    expect(result).toEqual({
      'user.name': {
        before: 'John',
        after: 'Jane',
        kind: 'update',
      },
    });
  });

  it('handles array element deletions', () => {
    const oldData = { items: ['apple', 'banana'] };
    const newData = { items: ['apple'] };

    const result = formatDeepDiff(oldData, newData);
    expect(result).toEqual({
      'items[1]': {
        before: 'banana',
        after: null,
        kind: 'remove',
      },
    });
  });

  it('ignores excluded fields even in nested objects', () => {
    const oldData = { user: { name: 'John', updatedAt: 'yesterday' } };
    const newData = { user: { name: 'Jane', updatedAt: 'today' } };

    const result = formatDeepDiff(oldData, newData);
    expect(result).toEqual({
      'user.name': {
        before: 'John',
        after: 'Jane',
        kind: 'update',
      },
    });
  });

  it('handles multiple change types at once', () => {
    const oldData = {
      name: 'John',
      age: 30,
      items: ['apple'],
    };
    const newData = {
      name: 'Jane',
      items: ['apple', 'banana'],
      city: 'Paris',
    };

    const result = formatDeepDiff(oldData, newData);
    expect(result).toEqual({
      name: {
        before: 'John',
        after: 'Jane',
        kind: 'update',
      },
      age: {
        before: 30,
        after: null,
        kind: 'remove',
      },
      city: {
        before: null,
        after: 'Paris',
        kind: 'add',
      },
      'items[1]': {
        before: null,
        after: 'banana',
        kind: 'add',
      },
    });
  });
});
