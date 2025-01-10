import type { ControlElement } from '../control/control';
import { Control } from '../control/control';
import { watchAttributes, watchChildren } from '../utils';

export type FormValidatorElement = HTMLFormElement & {
  validator?: FormValidator;
};

export class FormValidator {
  readonly form: HTMLFormElement;
  readonly controls: Set<Control>;

  protected _valid: boolean = true;

  constructor(form: FormValidatorElement) {
    form.validator = this;

    form.noValidate = true;

    this.form = form;
    this.controls = new Set();

    this.scan();

    watchChildren(form, () => {
      this.scan();
    });

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
    return this._valid;
  }

  get<T extends Control>(name: string) {
    return Array
      .from(this.controls)
      .find((field): field is T => field.el.name === name) ?? null;
  }

  async check() {
    this._valid = true;

    const controls = Array.from(this.controls);

    await Promise.all(
      controls
        .map(async (control) => control.check())
    );

    const valid = controls
      .every((control) => control.valid);

    this._valid = valid;

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

  add(field: Control) {
    watchAttributes(
      field.el,
      'type',
      () => {
        this.remove(field);
        this.add(
          new Control(field.el)
        );
      }
    );

    this.controls.add(field);
  }

  remove(field: Control) {
    this.controls.delete(field);
  }
}
