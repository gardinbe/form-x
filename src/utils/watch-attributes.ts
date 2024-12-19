/**
 * Creates a mutation observer which watches the passed attributes.
 * @param target - Element to watch.
 * @param attributes - Attributes to watch.
 * @param callback - Callback to execute when the attributes change.
 * @returns Mutation observer.
 */
export const watchAttributes = (
  target: Element,
  attributes: string | string[],
  callback: MutationCallback
): MutationObserver => {
  const observer = new MutationObserver(callback);

  observer.observe(target, {
    attributes: true,
    attributeFilter: Array.isArray(attributes)
      ? attributes
      : [attributes]
  });

  return observer;
};
