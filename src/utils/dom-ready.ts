import { on } from './dom-helpers';

/**
 * Executes a callback when the DOM is ready.
 * @param callback - Callback to execute.
 */
export const DOMReady = (callback: () => void): void => {
  if (['complete', 'interactive'].includes(document.readyState)) {
    callback();
    return;
  }

  const handler = (): void => {
    callback();
  };

  on(document, 'DOMContentLoaded', handler, { once: true });
};
