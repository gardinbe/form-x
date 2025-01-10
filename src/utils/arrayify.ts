/**
 * Converts a value to an array if it is not already an array.
 * @param value - Value to convert to an array.
 * @returns Array of values.
 */
export const arrayify = <T>(value: T | T[]): T[] =>
  Array.isArray(value)
    ? value
    : [value];
