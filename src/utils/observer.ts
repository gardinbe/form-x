import { flattenNodes } from './flatten';

/**
 * Returns a mutation observer that watches the children of the passed node.
 * @param node - Node to watch.
 * @param callback - Callback to execute when the children change.
 * @returns Mutation observer.
 */
export const childObserver = (
  node: Node,
  callback: (nodes: [Element[], Element[]]) => void
): MutationObserver => {
  const observer = new MutationObserver((mutations) => {
    const mutation = mutations.find((m) => m.type === 'childList');

    if (!mutation) {
      return;
    }

    callback([
      flattenNodes(mutation.removedNodes),
      flattenNodes(mutation.addedNodes)
    ]);
  });

  observer.observe(node, {
    childList: true,
    subtree: true
  });

  return observer;
};

/**
 * Returns a mutation observer that watches the attributes of the passed node.
 * @param node - Node to watch.
 * @param callback - Callback to execute when the attributes change.
 * @returns Mutation observer.
 */
export const attributeObserver = (
  node: Node,
  callback: (attr: string) => void
): MutationObserver => {
  const observer = new MutationObserver((mutations) => {
    const mutation = mutations.find((m) => m.type === 'attributes');

    if (!mutation?.attributeName) {
      return;
    }

    callback(mutation.attributeName);
  });

  observer.observe(node, {
    attributes: true
  });

  return observer;
};
