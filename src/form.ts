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
  #checking: boolean;

  #submitting: boolean;
  #propagate: boolean;
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
    this.#checking = false;

    // handle submit

    this.#submitting = false;
    this.#propagate = false;
    this.#submitHandler = this.#handleSubmit.bind(this);
    on(form, 'submit', this.#submitHandler);

    // watch attributes

    this.#ao = attributeObserver(form, this.#checkAttribute.bind(this));

    // set initial attributes

    form.noValidate = !this.inactive;
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
   * The last-checked validity of the form.
   *
   * **Note**: This is the validity of the form _since it was last checked_, not necessarily the
   * current validity.
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
      return true;
    }

    this.#checking = true;
    this.#set('fx-checking', true);

    const results = await Promise.all(
      [...this.controls].map(async (c) => c.check())
    );

    const valid = results.every((r) => r);

    if (valid) {
      this.setValid();
    } else {
      this.setInvalid();
    }

    this.#checking = false;
    this.#set('fx-checking', false);

    return this.#valid;
  }

  /**
   * Sets the form to be valid.
   */
  setValid(): void {
    this.#valid = true;
    this.#set('fx-invalid', false);
    this.#set('fx-valid', true);
  }

  /**
   * Sets the form to be invalid.
   */
  setInvalid(): void {
    this.#valid = false;
    this.#set('fx-valid', false);
    this.#set('fx-invalid', true);
  }

  /**
   * Submits the form.
   */
  async submit(): Promise<void> {
    await this.check();

    // wait for event loop to process current event

    await new Promise((res) => setTimeout(res));

    this.#submitting = false;

    if (!this.#valid) {
      return;
    }

    this.#propagate = true;
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
    this.#set('fx-valid', false);
    this.#set('fx-invalid', false);
    this.#set('fx-checking', false);
  }

  #handleSubmit(ev: SubmitEvent): void {
    if (this.#propagate) {
      this.#propagate = false;
      return;
    }

    ev.preventDefault();
    ev.stopImmediatePropagation();

    if (this.#submitting) {
      return;
    }

    this.#submitting = true;
    void this.submit();
  }

  #checkAttribute(attr: string): void {
    if (attr === 'fx-validate') {
      this.el.noValidate = !this.inactive;
      this.#set('fx-valid', this.valid);
      this.#set('fx-invalid', !this.valid);
      this.#set('fx-checking', this.#checking);
    }
  }

  #set(attr: `fx-${string}`, value: boolean): void {
    if (
      !this.inactive
      && value
    ) {
      setAttribute(this.el, attr, '');
    } else {
      delAttribute(this.el, attr);
    }
  }
}
