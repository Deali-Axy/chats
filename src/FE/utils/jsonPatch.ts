const JSON_PATCH_OPERATIONS = new Set([
  'add',
  'remove',
  'replace',
  'move',
  'copy',
  'test',
]);

const hasOwn = (value: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

/**
 * Checks the RFC 6902 document shape accepted by the API before saving it.
 * An empty value is valid because custom request-body overrides are optional.
 */
export const isValidJsonPatch = (value: string) => {
  if (value.trim() === '') {
    return true;
  }

  try {
    const patch: unknown = JSON.parse(value);
    if (!Array.isArray(patch)) {
      return false;
    }

    return patch.every((operation): operation is Record<string, unknown> => {
      if (
        typeof operation !== 'object' ||
        operation === null ||
        Array.isArray(operation)
      ) {
        return false;
      }

      const { op, path, from } = operation;
      if (typeof op !== 'string' || !JSON_PATCH_OPERATIONS.has(op) || typeof path !== 'string') {
        return false;
      }

      if (op === 'move' || op === 'copy') {
        return typeof from === 'string';
      }

      return op === 'remove' || hasOwn(operation, 'value');
    });
  } catch {
    return false;
  }
};
