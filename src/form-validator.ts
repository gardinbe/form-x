import { Control, type ControlElement } from './controls/control';
import { MultiControl, type MultiControlElement } from './controls/multi-control';
import { watchAttributes, watchChildren } from './utils';
import { type Validator } from './validators/validator';

export class FormValidator {
  readonly form: HTMLFormElement;
  readonly controls: Set<Control>;
  readonly validators: Validator[] | undefined;

  private _valid: boolean = true;

  constructor(
    form: HTMLFormElement,
    validators?: Validator[]
  ) {
    form.noValidate = true;

    this.form = form;
    this.controls = new Set();
    this.validators = validators;

    this.update();

    watchChildren(this.form, () => {
      this.update();
    });
  }

  get valid() {
    return this._valid;
  }

  get<T extends Control>(name: string) {
    return Array
      .from(this.controls)
      .find((field): field is T => field.element.name === name) ?? null;
  }

  async validate() {
    this._valid = true;

    const controls = Array.from(this.controls);

    const prom = controls
      .map((control) => control.validate.bind(control));

    await Promise.all(prom);

    const valid = controls
      .every((control) => control.valid);

    this._valid = valid;

    return valid;
  }

  watch() {
    for (const field of this.controls) {
      field.listen();
    }
  }

  ignore() {
    for (const field of this.controls) {
      field.ignore();
    }
  }

  private update() {
    const els = Array
      .from(this.form.elements)
      .filter((el) =>
        el instanceof HTMLInputElement
        || el instanceof HTMLTextAreaElement
        || el instanceof HTMLSelectElement);

    for (const el of els) {
      const
        hasExistingControl = Array
          .from(this.controls)
          .some((control) => control.element === el),
        hasControlWithSameName = el.name !== ''
          && Array
            .from(this.controls)
            .some((control) => control.element.name === el.name);

      if (
        hasExistingControl
        || hasControlWithSameName
      ) {
        continue;
      }

      const control = this.create(el);
      this.add(control);
    }

    const missingControls = Array
      .from(this.controls)
      .filter((control) => !els
        .some((el) => control.element === el));

    for (const control of missingControls) {
      this.remove(control);
    }
  }

  create(el: ControlElement) {
    switch (el.type) {
      case 'radio':
      case 'checkbox':
        return new MultiControl(el as MultiControlElement, this.validators);
      default:
        return new Control(el, this.validators);
    }
  }

  add(field: Control) {
    watchAttributes(
      field.element,
      'type',
      () => {
        this.remove(field);
        this.add(this.create(field.element));
      }
    );

    this.controls.add(field);
  }

  remove(field: Control) {
    this.controls.delete(field);
  }
}
