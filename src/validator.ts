import type { Control } from './control';
import { arrayify, attrErrorReason, getAttribute } from './utils';

export const enum ValidityState {
  VALID,
  INVALID
}

export type Validity =
  | [ValidityState.VALID, null]
  | [ValidityState.INVALID, string | null];

export type ValidationContext =
  | ValidationContextStandalone
  | ValidationContextAttributed;

export interface ValidationContextStandalone {
  /**
   * The name of the control.
   */
  label: string;

  /**
   * The value of the control.
   */
  value: string;

  /**
   * The control instance.
   */
  control: Control;
}

export interface ValidationContextAttributed extends ValidationContextStandalone {
  /**
   * The value of the attribute.
   */
  attributeValue: string;
}

export const enum ValidatorPriority {
  LOW,
  MEDIUM,
  HIGH
}

export type InvalidationFunction = (reason?: string) => void;

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
   * - `fx-pattern`
   * - `fx-preset`
   *
   * **Medium (1)** - Ran after high priority validators.
   * - `fx-minlength`
   * - `fx-maxlength`
   * - `fx-min`
   * - `fx-max`
   *
   * **High (2)** - Ran first.
   * - `fx-required`
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
  async run(control: Control): Promise<Validity> {
    const ctx: ValidationContextStandalone = {
      label: control.label,
      value: control.el.value,
      control
    };

    if (this.attributes) {
      const attr = this.attributes
        .map((a) => getAttribute(control.el, a))
        .find((v) => v !== null)
        ?? null;

      if (attr === null) {
        return [ValidityState.VALID, null];
      }

      (ctx as ValidationContextAttributed).attributeValue = attr;
    }

    let
      invalidated = false as boolean,
      reason = null as string | null;

    const invalidate: InvalidationFunction = (r) => {
      invalidated = true;
      reason = r ?? null;
    };

    await this.fn(invalidate, ctx);

    if (!invalidated) {
      return [ValidityState.VALID, null];
    }

    if (this.attributes) {
      reason = this.attributes
        .map((a) => getAttribute(control.el, attrErrorReason(a)))
        .find((v) => v !== null)
        ?? reason;
    }

    return [ValidityState.INVALID, reason];
  }
}
