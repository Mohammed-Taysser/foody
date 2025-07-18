import { diff as deepDiff } from 'deep-diff';

interface CleanDiff {
  [key: string]: {
    before: unknown;
    after: unknown;
    kind: 'update' | 'add' | 'remove';
  };
}

const excludeFields = ['updatedAt', 'createdAt', 'lastLogin', 'id', 'password'];

function formatDeepDiff(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): CleanDiff {
  const differences = deepDiff(oldData, newData, (path, key) => {
    // Ignore fields at any level that match one of the excluded keys
    return excludeFields.includes(key);
  });
  const result: CleanDiff = {};

  if (!differences) return result;

  for (const change of differences) {
    const path = change.path?.join('.') ?? 'unknown';

    switch (change.kind) {
      case 'E': // Edit
        result[path] = {
          before: change.lhs,
          after: change.rhs,
          kind: 'update',
        };
        break;

      case 'N': // New
        result[path] = {
          before: null,
          after: change.rhs,
          kind: 'add',
        };
        break;

      case 'D': // Deleted
        result[path] = {
          before: change.lhs,
          after: null,
          kind: 'remove',
        };
        break;

      case 'A': {
        // Array change
        const arrayPath = `${path}[${change.index}]`;
        const item = change.item;

        if (item.kind === 'E') {
          result[arrayPath] = {
            before: item.lhs,
            after: item.rhs,
            kind: 'update',
          };
        } else if (item.kind === 'N') {
          result[arrayPath] = {
            before: null,
            after: item.rhs,
            kind: 'add',
          };
        } else if (item.kind === 'D') {
          result[arrayPath] = {
            before: item.lhs,
            after: null,
            kind: 'remove',
          };
        }
        break;
      }
    }
  }

  return result;
}

export { formatDeepDiff };
