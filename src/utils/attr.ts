/**
 * Returns the value of an attribute.
 * @param el - Element to get the attribute from.
 * @param name - Name of the attribute.
 * @returns Value of the attribute.
 */
export const getAttr = (el: Element, name: string) =>
  el.getAttribute(name);

/**
 * Sets the value of an attribute.
 * @param el - Element to set the attribute on.
 * @param name - Name of the attribute.
 * @param value - Value of the attribute.
 */
export const setAttr = (el: Element, name: string, value: string) => {
  el.setAttribute(name, value);
};

/**
 * Checks if an attribute is truthy.
 * @param attr - Attribute to check.
 * @returns True if the attribute is truthy, false otherwise.
 */
export const truthyAttr = (attr: string | null) =>
  attr === ''
  || attr === 'true'
  || attr === '1';

/**
 * Returns all the values of a multi-value attribute.
 * @param attr - Attribute to get the values from.
 * @returns Array of values.
 */
export const multiAttr = (attr: string | null) =>
  attr?.split(':') ?? [];

/**
 * Returns the failure message attribute for a given attribute.
 * @param attr - Attribute to get the failure message attribute for.
 * @returns Failure message attribute.
 */
export const attrFailReason = (attr: string) =>
  `${attr}-fail` as const;
