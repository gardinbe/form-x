/**
 * Creates a mutation observer which watches the children of the passed element.
 * @param target - Element to watch.
 * @param callback - Callback to execute when the children change.
 * @returns Mutation observer.
 */
export const watchChildren = (
  target: Element,
  callback: MutationCallback
): MutationObserver => {
  const observer = new MutationObserver(callback);

  observer.observe(target, {
    childList: true,
    subtree: true
  });

  return observer;
};
