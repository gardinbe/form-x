/**
 * A promise that resolves if/once the DOM has loaded.
 */
export const DOMReady = new Promise<void>((resolve) => {
  if (
    document.readyState === 'complete'
		|| document.readyState === 'interactive'
  ) {
    resolve();
    return;
  }

  const loaded = (): void => {
    resolve();
  };

  document.addEventListener('DOMContentLoaded', loaded, { once: true });
});
