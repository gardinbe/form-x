/**
 * Returns the value of an attribute.
 * @param el - Element to get the attribute from.
 * @param name - Name of the attribute.
 * @returns Value of the attribute.
 */
export const getAttr = (el: Element, name: string): string | null => {
  return el.getAttribute(name);
};

/**
 * Sets the value of an attribute.
 * @param el - Element to set the attribute on.
 * @param name - Name of the attribute.
 * @param value - Value of the attribute.
 */
export const setAttr = (el: Element, name: string, value: string): void => {
  el.setAttribute(name, value);
};

/**
 * Checks if an attribute value is truthy.
 * @param value - Attribute value to check.
 * @returns True if the attribute value is truthy, false otherwise.
 */
export const truthyAttr = (value: string | null): boolean => {
  return (
    value === ''
    || value === 'true'
    || value === '1'
  );
};

/**
 * Returns individual values from a comma-separated attribute value.
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
 * Returns a sanitized version of an attribute to be used within a querySelector.
 * @param attr - Attribute to sanitize.
 * @returns Sanitized attribute.
 */
export const sanitizeAttrQuery = (attr: string): string => {
  return attr.replace(/'/g, '\\\'');
};
