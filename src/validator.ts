import type { FXControl } from './control';
import { arrayify, attrErrorReason, getAttr } from './utils';

export const enum ValidationState {
  PASS,
  FAIL
}

export type Validation =
  | [ValidationState.PASS, null]
  | [ValidationState.FAIL, string];

// context

export type ValidationContext =
  | ValidationContextStandalone
  | ValidationContextAttributed;

export interface ValidationContextStandalone {
  /**
   * The name of the control.
   */
  name: string;

  /**
   * The value of the control.
   */
  value: string;

  /**
   * The control instance.
   */
  control: FXControl;
}

export interface ValidationContextAttributed extends ValidationContextStandalone {
  /**
   * The value of the attribute.
   */
  attributeValue: string;
}

// setup

export const enum ValidatorPriority {
  LOW,
  MEDIUM,
  HIGH
}

export type InvalidationFunction = (reason: string) => void;

export type ValidatorFunction<
  C extends ValidationContextStandalone = ValidationContextStandalone
> = (
  /**
   * Invalidates the control with the given error reason (if given).
   * @param reason - Error reason.
   */
  invalidate: InvalidationFunction,

  /**
   * The validation context.
   */
  ctx: C
) => void | Promise<void>;

export type ValidatorSetup =
  | ValidatorSetupStandalone
  | ValidatorSetupAttributed;

export interface ValidatorSetupStandalone<
  C extends ValidationContextStandalone = ValidationContextStandalone
> {
  /**
   * The name of the validator.
   */
  name: string;

  /**
   * The priority of the validator.
   *
   * The available priorities are:
   *
   * **Low (0)** - Ran after all other validators.
   * - `pattern`
   * - `preset`
   *
   * **Medium (1)** - Ran after high priority validators.
   * - `minlength`
   * - `maxlength`
   * - `min`
   * - `max`
   *
   * **High (2)** - Ran first.
   * - `required`
   *
   * @default 0 // ValidatorPriority.LOW
   */
  priority?: ValidatorPriority;

  /**
   * The validator function.
   */
  fn: ValidatorFunction<C>;
}

export interface ValidatorSetupAttributed extends
  ValidatorSetupStandalone<ValidationContextAttributed> {
  /**
   * The attributes that the validator triggers on.
   */
  attribute: string | string[];
}

/**
 * A form-x validator.
 */
export class Validator {
  /**
   * The name of the validator.
   */
  readonly name: string | symbol;

  /**
   * The priority of the validator.
   */
  readonly priority: ValidatorPriority;

  /**
   * The attributes that the validator triggers on.
   */
  readonly attributes: string[] | null;

  /**
   * The validator function.
   */
  readonly fn: ValidatorFunction;

  /**
   * Creates a new form-x validator.
   * @param fn - Validator function.
   */
  constructor(fn: ValidatorFunction);

  /**
   * Creates a new form-x validator.
   *
   * Enabled by setting the given attribute(s) on the target element(s).
   * @param setup - Validator setup.
   */
  constructor(setup: ValidatorSetupAttributed);

  /**
   * Creates a new form-x validator.
   * @param setup - Validator setup.
   */
  constructor(setup: ValidatorSetupStandalone);

  constructor(param: ValidatorFunction | ValidatorSetup) {
    if (typeof param === 'function') {
      this.name = Symbol();
      this.priority = ValidatorPriority.LOW;
      this.attributes = null;
      this.fn = async (invalidate, ctx): Promise<void> =>
        param(invalidate, ctx as ValidationContextAttributed);
    } else {
      this.name = param.name;
      this.priority = param.priority ?? ValidatorPriority.LOW;
      this.attributes = 'attribute' in param
        ? arrayify(param.attribute)
        : null;
      this.fn = async (invalidate, ctx): Promise<void> =>
        param.fn(invalidate, ctx as ValidationContextAttributed);
    }
  }

  /**
   * Runs the validator.
   * @param control - Control to validate.
   * @returns Promise that resolves to the validation result.
   */
  async run(control: FXControl): Promise<Validation> {
    const ctx: ValidationContextStandalone = {
      name: control.name,
      value: control.el.value,
      control
    };

    if (this.attributes) {
      const attr = this.attributes
        .map((a) => getAttr(control.el, a))
        .find((v) => v !== null)
        ?? null;

      if (attr === null) {
        return [ValidationState.PASS, null];
      }

      (ctx as ValidationContextAttributed).attributeValue = attr;
    }

    let reason = null as string | null;

    const invalidate: InvalidationFunction = (r) => {
      reason = r;
    };

    await this.fn(invalidate, ctx);

    if (!reason) {
      return [ValidationState.PASS, null];
    }

    if (this.attributes) {
      reason = this.attributes
        .map((a) => getAttr(control.el, attrErrorReason(a)))
        .find((v) => v !== null)
        ?? reason;
    }

    return [ValidationState.FAIL, reason];
  }
}
