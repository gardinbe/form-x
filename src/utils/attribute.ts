/**
 * Checks if the given attribute's value is truthy.
 * @param value - Attribute value to check.
 * @returns `true` if the attribute value is truthy.
 */
export const truthyAttr = (value: string | null): boolean => {
  return (
    value === ''
    || value === 'true'
    || value === '1'
  );
};

/**
 * Returns the given attribute's comma-separated values.
 * @param value - Attribute value to extract the individual values from.
 * @returns Array of values.
 */
export const multiAttr = (value: string | null): string[] => {
  if (value === null) {
    return [];
  }

  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v !== '');
};

/**
 * Returns the error message for a given attribute.
 * @param attribute - Attribute to get the error message for.
 * @returns Value of the error message attribute.
 */
export const attrErrorReason = <T extends string>(attribute: T): `${T}:error` => {
  return `${attribute}:error`;
};

/**
 * Returns a sanitized version of an attribute to be used within an element selector.
 * @param attr - Attribute to sanitize.
 * @returns Sanitized attribute.
 */
export const sanitizeAttrQuery = (attr: string): string => {
  return attr.replace(/'/g, '\\\'');
};
