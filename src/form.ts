import { FXControl } from './control';
import { fx } from './global';
import { getAttr, setAttr, truthyAttr } from './utils';

export type FXFormElement = HTMLFormElement;

/**
 * A form-x form.
 */
export class FXForm {
  /**
   * Checks if the given node is a form element.
   * @returns `true` if the node is a form element.
   */
  static isEl(node: Node): node is FXFormElement {
    return node instanceof HTMLFormElement;
  }

  /**
   * The element the instance is attached to.
   */
  readonly el: HTMLFormElement;

  #valid: boolean;

  readonly #submitHandler: (ev: SubmitEvent) => void;

  /**
   * Creates a new form-x form.
   *
   * **Note**: Form elements in the document will already have a form-x form instance: you won't
   * need to create one.
   * @param form - Element to attach the instance to.
   */
  constructor(form: FXFormElement) {
    form.noValidate = true;

    this.el = form;
    this.#valid = true;

    this.#submitHandler = this.#handleSubmit.bind(this);
    form.addEventListener('submit', this.#submitHandler);

    // init read-only attributes

    this.#valid$ = true;
    this.#checking$ = false;
  }

  /**
   * Set of the current controls on the form.
   */
  get controls(): Set<FXControl> {
    return new Set(
      [...this.el.elements]
        .map((el) => fx(el))
        .filter((el): el is FXControl => !!el)
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
   * Checks the validity of the form.
   *
   * This checks the validity of all controls within the form.
   * @returns Promise that resolves to `true` if all controls in the form are valid.
   */
  async check(): Promise<boolean> {
    this.#valid = true;

    if (this.#disabled) {
      return true;
    }

    this.#checking$ = true;

    const results = await Promise.all(
      [...this.controls].map(async (c) => c.check())
    );

    const valid = results.every((r) => r);

    if (valid) {
      this.setValid();
    } else {
      this.setInvalid();
    }

    this.#checking$ = false;

    return this.#valid;
  }

  /**
   * Sets the form to be valid.
   */
  setValid(): void {
    this.#valid = true;
    this.#valid$ = true;
  }

  /**
   * Sets the form to be invalid.
   */
  setInvalid(): void {
    this.#valid = false;
    this.#valid$ = false;
  }

  /**
   * Destroys the instance.
   *
   * Removes all event listeners and disconnects observers.
   */
  destroy(): void {
    this.el.removeEventListener('submit', this.#submitHandler);
  }

  #handleSubmit(ev: SubmitEvent): void {
    ev.preventDefault();

    void (async (): Promise<void> => {
      await this.check();

      if (!this.#valid) {
        return;
      }

      this.el.removeEventListener('submit', this.#submitHandler);
      this.el.submit();
    })();
  }

  get #disabled(): boolean {
    return !truthyAttr(getAttr(this.el, 'fx-validate'));
  }

  set #valid$(v: boolean) {
    setAttr(this.el, 'fx-valid', `${v}`);
  }

  set #checking$(v: boolean) {
    setAttr(this.el, 'fx-checking', `${v}`);
  }
}
