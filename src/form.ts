import { Control } from './control';
import { fx } from './fx';
import {
  attributeObserver,
  delAttribute,
  getAttribute,
  off,
  on,
  setAttribute,
  truthyAttr
} from './utils';

export type FormElement = HTMLFormElement;

/**
 * A form-x form.
 */
export class Form<E extends FormElement = FormElement> {
  /**
   * Checks if the given node is a form element.
   * @returns `true` if the node is a form element.
   */
  static isEl(node: Node): node is FormElement {
    return node instanceof HTMLFormElement;
  }

  /**
   * The element the instance is attached to.
   */
  readonly el: E;

  #valid: boolean;

  readonly #submitHandler: (ev: SubmitEvent) => void;
  readonly #ao: MutationObserver;

  /**
   * Creates a new form-x form.
   *
   * **Note**: Form elements in the document will already have a form-x form instance: you won't
   * need to create one.
   * @param form - Element to attach the instance to.
   */
  constructor(form: E) {
    this.el = form;
    this.#valid = true;

    this.#submitHandler = (ev): void => {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      void this.submit();
    };

    on(form, 'reset', this.#submitHandler);

    // watch attributes

    this.#ao = attributeObserver(form, this.#checkAttribute.bind(this));

    // init state attributes

    this.el.noValidate = !this.inactive;
    this.#setState('fx-valid', !this.inactive ? this.valid : null);
    this.#setState('fx-checking', !this.inactive ? false : null);
  }

  /**
   * Set of the current controls on the form.
   */
  get controls(): Set<Control> {
    return new Set(
      [...this.el.elements]
        .map((el) => fx(el))
        .filter((el): el is Control => !!el)
    );
  }

  /**
   * The current validity of the form.
   *
   * **Note**: This is the known validity of the form _since it was last checked_, not necessarily
   * the current validity.
   *
   * To get the current validity, use `check()`.
   */
  get valid(): boolean {
    return this.#valid;
  }

  /**
   * Whether the form is inactive.
   */
  get inactive(): boolean {
    return !truthyAttr(getAttribute(this.el, 'fx-validate'));
  }

  /**
   * Checks the validity of the form.
   *
   * This checks the validity of all controls within the form.
   * @returns Promise that resolves to `true` if all controls in the form are valid.
   */
  async check(): Promise<boolean> {
    this.#valid = true;

    if (this.inactive) {
      this.#setState('fx-valid', null);
      this.#setState('fx-checking', null);
      return true;
    }

    this.#setState('fx-checking', true);

    const results = await Promise.all(
      [...this.controls].map(async (c) => c.check())
    );

    const valid = results.every((r) => r);

    if (valid) {
      this.setValid();
    } else {
      this.setInvalid();
    }

    this.#setState('fx-checking', false);
    return this.#valid;
  }

  /**
   * Sets the form to be valid.
   */
  setValid(): void {
    this.#valid = true;
    this.#setState('fx-valid', true);
  }

  /**
   * Sets the form to be invalid.
   */
  setInvalid(): void {
    this.#valid = false;
    this.#setState('fx-valid', false);
  }

  async submit(): Promise<void> {
    await this.check();

    if (!this.#valid) {
      return;
    }

    off(this.el, 'submit', this.#submitHandler);
    this.el.requestSubmit();
  }

  /**
   * Destroys the instance.
   *
   * Removes all event listeners, disconnects observers and removes all state attributes.
   */
  destroy(): void {
    this.#ao.disconnect();
    off(this.el, 'submit', this.#submitHandler);

    this.el.noValidate = false;
    this.#setState('fx-valid', null);
    this.#setState('fx-checking', null);
  }

  #checkAttribute(attr: string): void {
    if (attr === 'fx-validate') {
      this.el.noValidate = !this.inactive;
      this.#setState('fx-valid', !this.inactive ? this.valid : null);
      this.#setState('fx-checking', !this.inactive ? false : null);
    }
  }

  #setState(attr: string, value: boolean | string | number | null): void {
    if (value === null) {
      delAttribute(this.el, attr);
      return;
    }

    setAttribute(this.el, attr, `${value}`);
  }
}
