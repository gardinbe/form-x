import { FXControl } from './control';
import { getAttr, setAttr, truthyAttr } from './utils';

export type FormEl = HTMLFormElement;

export type FXFormEl = FormEl & {
  fx: FXForm;
};

export class FXForm {
  static has(node: Node): node is FXFormEl {
    return (
      'fx' in node
      && node.fx instanceof FXForm
    );
  }

  static isEl(node: Node): node is FormEl {
    return node instanceof HTMLFormElement;
  }

  readonly el: HTMLFormElement;

  #valid: boolean;

  readonly #submitHandler: (ev: SubmitEvent) => void;

  constructor(form: FormEl) {
    form.fx = this;
    form.noValidate = true;

    this.el = form;
    this.#valid = true;

    this.#submitHandler = this.#handleSubmit.bind(this);
    form.addEventListener('submit', this.#submitHandler);

    // init read-only attributes

    this.#valid$ = true;
    this.#checking$ = false;
  }

  get controls(): FXControl[] {
    return [...this.el.elements]
      .filter(FXControl.has)
      .map((el) => el.fx);
  }

  get valid(): boolean {
    return this.#valid;
  }

  async check(): Promise<boolean> {
    this.#valid = true;

    if (this.#disabled) {
      return true;
    }

    this.#checking$ = true;

    const results = await Promise.all(
      this.controls.map(async (c) => c.check())
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

  setValid(): void {
    this.#valid = true;
    this.#valid$ = true;
  }

  setInvalid(): void {
    this.#valid = false;
    this.#valid$ = false;
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

  destroy(): void {
    this.el.removeEventListener('submit', this.#submitHandler);
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
