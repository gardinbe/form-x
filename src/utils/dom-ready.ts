/**
 * A promise that resolves if/once the DOM has loaded.
 *
 * This will not be needed if the script is imported into the document as a module (type="module").
 */
export const domReady = new Promise<void>((resolve) => {
  if (
    document.readyState === 'complete'
    || document.readyState === 'interactive'
  ) {
    resolve();
    return;
  }

  const loaded = () => {
    resolve();
  };

  document.addEventListener(
    'DOMContentLoaded',
    loaded,
    { once: true }
  );
});
