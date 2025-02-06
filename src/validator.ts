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
  | ValidationContextRaw
  | ValidationContextAttributed;

export interface ValidationContextRaw {
  name: string;
  value: string;
  control: FXControl;
}

export interface ValidationContextAttributed extends ValidationContextRaw {
  attributeValue: string;
}

// setup

export const enum ValidatorPriority {
  LOW,
  MEDIUM,
  HIGH
}

export type InvalidatorFunction = (reason: string) => void;

export type ValidatorSetupFunction<C extends ValidationContextRaw = ValidationContextRaw> = (
  invalidate: InvalidatorFunction,
  ctx: C
) => void | Promise<void>;

export type ValidatorSetup =
  | ValidatorSetupRaw
  | ValidatorSetupAttributed;

export interface ValidatorSetupRaw<C extends ValidationContextRaw = ValidationContextRaw> {
  name: string;
  priority?: ValidatorPriority;
  fn: ValidatorSetupFunction<C>;
}

export interface ValidatorSetupAttributed extends ValidatorSetupRaw<ValidationContextAttributed> {
  attribute: string | string[];
}

export class Validator {
  readonly name: string;
  readonly priority: ValidatorPriority;
  readonly attributes: string[] | null;
  readonly #fn: ValidatorSetupFunction;

  constructor(setup: ValidatorSetupAttributed);
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  constructor(setup: ValidatorSetupRaw);
  constructor(setup: ValidatorSetup) {
    this.name = setup.name;
    this.priority = setup.priority ?? ValidatorPriority.LOW;

    this.attributes = 'attribute' in setup
      ? arrayify(setup.attribute).map((a) => `fx-${a}`)
      : null;

    this.#fn = async (invalidate, ctx): Promise<void> =>
      setup.fn(invalidate, ctx as ValidationContextAttributed);
  }

  async exec(control: FXControl): Promise<Validation> {
    const ctx: ValidationContextRaw = {
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
