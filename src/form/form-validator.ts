import type { ControlElement } from '../control/control';
import { Control } from '../control/control';
import { watchAttrs, watchChildren } from '../utils';

export type FormValidatorElement = HTMLFormElement & {
  validator?: FormValidator;
};

export class FormValidator {
  readonly form: HTMLFormElement;
  readonly controls: Set<Control>;

  #valid: boolean = true;

  constructor(form: FormValidatorElement) {
    form.validator = this;

    form.noValidate = true;

    this.form = form;
    this.controls = new Set();

    this.scan();

    watchChildren(
      form,
      () => {
        this.scan();
      }
    );

    const submit = (ev: SubmitEvent) => {
      ev.preventDefault();

      const check = async () => {
        await this.check();

        if (!this.valid) {
          return;
        }

        form.removeEventListener('submit', submit);
        form.submit();
      };

      void check();
    };

    form.addEventListener('submit', submit);
  }

  get valid() {
    return this.#valid;
  }

  get<T extends Control>(name: string) {
    return Array
      .from(this.controls)
      .find((control): control is T => control.el.name === name) ?? null;
  }

  async check() {
    this.#valid = true;

    const controls = Array.from(this.controls);

    await Promise.all(
      controls
        .map(async (control) => control.check())
    );

    const valid = controls
      .every((control) => control.valid);

    this.#valid = valid;

    return valid;
  }

  scan() {
    const els = Array
      .from(this.form.elements)
      .filter((el): el is ControlElement =>
        el instanceof HTMLInputElement
        || el instanceof HTMLTextAreaElement
        || el instanceof HTMLSelectElement);

    for (const el of els) {
      const hasExistingControl = Array
        .from(this.controls)
        .some((control) => control.el === el);

      const hasControlWithSameName = el.name !== ''
          && Array
            .from(this.controls)
            .some((control) => control.el.name === el.name);

      if (
        hasExistingControl
        || hasControlWithSameName
      ) {
        continue;
      }

      const control = el.validator ?? new Control(el);
      this.add(control);
    }

    const missingControls = Array
      .from(this.controls)
      .filter((control) => !els
        .some((el) => control.el === el));

    for (const control of missingControls) {
      this.remove(control);
    }
  }

  add(control: Control) {
    const watchControlAttrs = watchAttrs(
      control.el,
      () => {
        this.remove(control);
        this.add(new Control(control.el));
      }
    );

    watchControlAttrs('type');

    this.controls.add(control);
  }

  remove(control: Control) {
    this.controls.delete(control);
  }
}
