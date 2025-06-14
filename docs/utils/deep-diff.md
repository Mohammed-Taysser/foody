# `formatDeepDiff` Utility

A TypeScript utility function to generate a clean, structured diff between two objects, omitting specific sensitive or irrelevant fields. This is particularly useful for auditing, logging, or generating user-friendly change histories.

## ✨ Features

- Wraps `deep-diff` to produce a simplified and structured diff.
- Excludes fields like `updatedAt`, `createdAt`, `lastLogin`, `id`, and `password`.
- Outputs diffs in a key-value format, where each key is the property path.

## `formatDeepDiff<T>(oldData: T, newData: T): CleanDif`

Compares two objects deeply and returns a structured diff excluding sensitive fields.

**Parameters**:

- `oldData: T` — The original object.

- `newData: T` — The updated object to compare with the original.

**Returns**:

- `CleanDiff`: A plain object with keys as property paths and values describing the type of change.

### Example

```ts
const oldUser = {
  name: 'Alice',
  age: 30,
  password: 'secret',
};

const newUser = {
  name: 'Alice Smith',
  age: 30,
  password: 'newSecret',
};

const diff = formatDeepDiff(oldUser, newUser);
console.log(diff);
```

Output

```ts
{
  "name": {
    before: "Alice",
    after: "Alice Smith",
    kind: "update"
  }
}
```

> Note: password was excluded.

## Types

```ts
interface CleanDiff {
  [key: string]: {
    before: unknown;
    after: unknown;
    kind: 'update' | 'add' | 'remove';
  };
}
```

## Excluded Fields

The following fields are ignored at any nesting level:

- `updatedAt`
- `createdAt`
- `lastLogin`
- `id`
- `password`
