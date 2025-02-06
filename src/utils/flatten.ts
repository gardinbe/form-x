/**
 * Returns a flattened array containing the given element and all of its children, recursively.
 * @param el - Root element.
 * @returns Flattened array of elements.
 */
export const flattenEl = (el: Element): Element[] => {
  return [el, ...[...el.children].flatMap(flattenEl)];
};

/**
 * Returns a flattened array containing the elements in the given iterable and all of their
 * children, recursively.
 * @param nodes - `NodeList` to flatten.
 * @returns Flattened array of elements.
 */
export const flattenNodes = (nodes: Iterable<Node>): Element[] => {
  return [...nodes]
    .filter((n): n is Element => n.nodeType === Node.ELEMENT_NODE)
    .flatMap(flattenEl);
};
