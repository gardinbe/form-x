import type { FXControl } from './control';
import { arrayify, attrErrorReason, getAttr } from './utils';

export type ValidationResult =
  | [true, null?]
  | [false, string];

export const enum ValidationResultState {
  PASS,
  FAIL
}

export type Validation =
  | [ValidationResultState.PASS, null]
  | [ValidationResultState.FAIL, string];

// context

export type ValidationContext =
  | ValidationContextStandalone
  | ValidationContextAttributed;

export interface ValidationContextStandalone {
  name: string;
  value: string;
  control: FXControl;
}

export interface ValidationContextAttributed extends ValidationContextStandalone {
  attributeValue: string;
}

// setup

export const enum ValidatorPriority {
  LOW,
  MEDIUM,
  HIGH
}

export type InvalidatorFunction = (reason: string) => void;

export type ValidatorSetupFunction =
  | ValidatorSetupFunctionStandalone
  | ValidatorSetupFunctionAttributed;

export type ValidatorSetupFunctionStandalone<
  C extends ValidationContextStandalone = ValidationContextStandalone
> = (
  invalidate: InvalidatorFunction,
  ctx: C
) => void | Promise<void>;

export type ValidatorSetupFunctionAttributed = ValidatorSetupFunctionStandalone<
  ValidationContextAttributed
>;

export type ValidatorSetup =
  | ValidatorSetupStandalone
  | ValidatorSetupAttributed;

export interface ValidatorSetupStandalone<
  C extends ValidationContextStandalone = ValidationContextStandalone
> {
  name: string;
  priority?: ValidatorPriority;
  fn: ValidatorSetupFunctionStandalone<C>;
}

export interface ValidatorSetupAttributed extends
  ValidatorSetupStandalone<ValidationContextAttributed> {
  attribute: string | string[];
}

export class Validator {
  readonly name: string | symbol;
  readonly priority: ValidatorPriority;
  readonly attributes: string[] | null;
  readonly #fn: ValidatorSetupFunctionStandalone;

  constructor(fn: ValidatorSetupFunctionAttributed);
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  constructor(fn: ValidatorSetupFunctionStandalone);
  constructor(setup: ValidatorSetupAttributed);
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  constructor(setup: ValidatorSetupStandalone);
  constructor(setup: ValidatorSetupFunction | ValidatorSetup) {
    if (typeof setup === 'function') {
      this.name = Symbol(); // TODO: hack
      this.priority = ValidatorPriority.LOW;
      this.attributes = null;
      this.#fn = async (invalidate, ctx): Promise<void> =>
        setup(invalidate, ctx as ValidationContextAttributed);
    } else {
      this.name = setup.name;
      this.priority = setup.priority ?? ValidatorPriority.LOW;
      this.attributes = 'attribute' in setup
        ? arrayify(setup.attribute)
        : null;
      this.#fn = async (invalidate, ctx): Promise<void> =>
        setup.fn(invalidate, ctx as ValidationContextAttributed);
    }
  }

  async exec(control: FXControl): Promise<Validation> {
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
        return [ValidationResultState.PASS, null];
      }

      (ctx as ValidationContextAttributed).attributeValue = attr;
    }

    let reason = null as string | null;

    const invalidate: InvalidatorFunction = (r) => {
      reason = r;
    };

    await this.#fn(invalidate, ctx);

    if (!reason) {
      return [ValidationResultState.PASS, null];
    }

    if (this.attributes) {
      reason = this.attributes
        .map((a) => getAttr(control.el, attrErrorReason(a)))
        .find((v) => v !== null)
        ?? reason;
    }

    return [ValidationResultState.FAIL, reason];
  }
}
