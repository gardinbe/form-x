/**
 * Returns an array containing the given value or values.
 * @param value - Value or values.
 * @returns Array of values.
 */
export const arrayify = <T>(value: T | T[]): T[] => {
  return Array.isArray(value)
    ? value
    : [value];
};
