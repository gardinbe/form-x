import { arrayify } from './arrayify';

/**
 * Creates a mutation observer which watches the passed attributes.
 * @param el - Element to watch.
 * @param attributes - Attributes to watch.
 * @param callback - Callback to execute when the attributes change.
 * @returns Mutation observer.
 */
export const watchAttributes = (
  el: Element,
  attributes: string | string[],
  callback: MutationCallback
): MutationObserver => {
  const observer = new MutationObserver(callback);

  observer.observe(el, {
    attributes: true,
    attributeFilter: arrayify(attributes)
  });

  return observer;
};

/**
 * Creates a mutation observer which watches the children of the passed element.
 * @param el - Element to watch.
 * @param callback - Callback to execute when the children change.
 * @returns Mutation observer.
 */
export const watchChildren = (
  el: Element,
  callback: MutationCallback
): MutationObserver => {
  const observer = new MutationObserver(callback);

  observer.observe(el, {
    childList: true,
    subtree: true
  });

  return observer;
};
