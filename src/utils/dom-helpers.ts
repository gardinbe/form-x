/**
 * Returns the first element that matches the given selector.
 * @param selector - Selector to match.
 * @param parent - Parent node.
 * @returns Element that matches the selector.
 */
export const query = <E extends HTMLElement>(
  selector: string,
  parent: ParentNode = document
): E | null => {
  return parent.querySelector<E>(selector);
};

/**
 * Returns all elements that match the given selector.
 * @param selector - Selector to match.
 * @param parent - Parent node.
 * @returns Elements that match the selector.
 */
export const queryAll = <E extends HTMLElement>(
  selector: string,
  parent: ParentNode = document
): E[] => {
  return Array.from(parent.querySelectorAll<E>(selector));
};

/**
 * Adds an event listener to an element.
 * @param target - Event target.
 * @param type - Type of the event.
 * @param handler - Handler for the event.
 * @param options - Options for the event listener.
 */
export const on = <E extends Event>(
  target: EventTarget,
  type: string,
  handler: (ev: E) => void,
  options?: AddEventListenerOptions | boolean
): void => {
  target.addEventListener(
    type,
    handler as EventListener,
    options
  );
};

/**
 * Removes an event listener from an element.
 * @param target - Event target.
 * @param type - Type of the event.
 * @param handler - Handler for the event.
 * @param options - Options for the event listener.
 */
export const off = <E extends Event>(
  target: EventTarget,
  type: string,
  handler: (ev: E) => void,
  options?: AddEventListenerOptions | boolean
): void => {
  target.removeEventListener(
    type,
    handler as EventListener,
    options
  );
};

/**
 * Returns the value of an attribute.
 * @param el - Element to get the attribute from.
 * @param name - Name of the attribute.
 * @returns Value of the attribute.
 */
export const getAttribute = (el: Element, name: string): string | null => {
  return el.getAttribute(name);
};

/**
 * Sets the value of an attribute.
 * @param el - Element to set the attribute on.
 * @param name - Name of the attribute.
 * @param value - Value of the attribute.
 */
export const setAttribute = (el: Element, name: string, value: string): void => {
  el.setAttribute(name, value);
};

/**
 * Removes an attribute from an element.
 * @param el - Element to remove the attribute from.
 * @param name - Name of the attribute.
 */
export const delAttribute = (el: Element, name: string): void => {
  el.removeAttribute(name);
};
