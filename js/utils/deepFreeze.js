/**
 * Recursively freezes an object and all nested object values.
 * Pure, domain-agnostic; returns the same reference (frozen) for composition.
 * @template {object} T
 * @param {T} value
 * @returns {T}
 */
const deepFreeze = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
};

export default deepFreeze;
