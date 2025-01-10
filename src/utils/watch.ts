import { arrayify } from './arrayify';

export type WatchAttributesFn = (...attrs: string[]) => void;

/**
 * Creates a mutation observer which watches the passed attributes.
 * @param el - Element to watch.
 * @param callback - Callback to execute when the attributes change.
 * @returns Attribute watcher function.
 */
export const watchAttrs = (
  el: Element,
  callback: MutationCallback
): WatchAttributesFn => {
  const observer = new MutationObserver(callback);

  const run = (attrs: string | string[]) => {
    observer.disconnect();
    observer.observe(el, {
      attributes: true,
      attributeFilter: arrayify(attrs)
    });
  };

  return run;
};

/**
 * Creates a mutation observer which watches the children of the passed element.
 * @param el - Element to watch.
 * @param callback - Callback to execute when the children change.
 */
export const watchChildren = (
  el: Element,
  callback: MutationCallback
) => {
  const observer = new MutationObserver(callback);

  observer.observe(el, {
    childList: true,
    subtree: true
  });
};
