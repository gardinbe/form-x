import { attr, truthyAttr, watchAttributes } from '../utils';
import { CoreValidators } from '../validators/core-validators';
import {
  type CompletedValidation,
  type FailedResult,
  ValidationState,
  Validator
} from '../validators/validator';

export type ControlElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

export class Control<E extends ControlElement = ControlElement> {
  private static CoreAttributes = [
    'disabled',
    'fx-validate',
    'fx-display-name'
  ];

  readonly element: E;
  protected _valid: boolean;
  protected _validators: Map<string, Validator>;
  protected _errorsEl: HTMLElement | null;
  protected _errors: Set<string>;
  protected handler: EventListener | null;

  constructor(el: E, validators?: Validator[]) {
    this.element = el;
    this._valid = true;
    this._errorsEl = document
      .querySelector(`[fx-errors='${el.name}']`);
    this._errors = new Set();
    this.handler = null;

    this._validators = new Map(
      Object
        .values(CoreValidators)
        .concat(validators ?? [])
        .map((v) => [
          v.setup.name,
          v
        ])
    );

    const attributes = Array
      .from(this._validators.values())
      .flatMap((validator) => Array.isArray(validator.setup.attribute)
        ? validator.setup.attribute
        : [validator.setup.attribute])
      .map((attribute) => `fx-${attribute}`)
      .concat(Control.CoreAttributes);

    watchAttributes(
      this.element,
      attributes,
      () => void this.validate()
    );
  }

  get valid() {
    return this._valid;
  }

  async validate() {
    if (
      this.$disabled
      || !this.$validate
    ) {
      this.setValid();
      return;
    }

    this.$validating = true;

    const promisedValidations = Array
      .from(this._validators.values())
      .map(async (validator) => validator.run(this));

    const validations = await Promise.all(promisedValidations);

    const valid = validations
      .every((validation) =>
        validation.state === ValidationState.COMPLETED
        && validation.result.valid);

    if (valid) {
      this.setValid();
    } else {
      const errors = validations
        .filter((validation): validation is CompletedValidation<FailedResult> =>
          validation.state === ValidationState.COMPLETED
          && !validation.result.valid)
        .map((validation) => validation.result.reason);

      this.setInvalid(...errors);
    }

    this.$validating = false;
  }

  add(validator: Validator) {
    this._validators.set(validator.setup.name, validator);
  }

  listen() {
    if (this.handler) {
      return;
    }

    this.handler = () =>
      void this.validate();

    this.element.addEventListener('input', this.handler);
    this.element.addEventListener('change', this.handler);
  }

  ignore() {
    if (!this.handler) {
      return;
    }

    this.element.removeEventListener('input', this.handler);
    this.element.removeEventListener('change', this.handler);

    this.handler = null;
  }

  protected setValid() {
    this._valid = true;
    this._errors = new Set();
    this.element.setAttribute('fx-valid', 'true');
  }

  protected setInvalid(...reasons: string[]) {
    this._valid = false;

    for (const reason of reasons) {
      this._errors.add(reason);
    }

    this.element.setAttribute('fx-valid', 'false');
  }

  protected init() {
    this.element.setAttribute('fx-valid', `${this._valid}`);
    this.element.setAttribute('fx-validating', 'false');
  }

  get $validating() {
    return truthyAttr(attr(this.element, 'fx-validating'));
  }

  protected set $validating(value) {
    this.element.setAttribute('fx-validating', `${value}`);
  }

  get $displayName() {
    return attr(this.element, 'fx-display-name') ?? 'Field';
  }

  get $disabled() {
    return this.element.disabled;
  }

  get $validate() {
    return !truthyAttr(attr(this.element, 'fx-validate'));
  }
}
