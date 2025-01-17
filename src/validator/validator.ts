import type { FXControl } from '../control/control';
import { arrayify, attrFailReason, getAttr } from '../utils';

export type Result = [
  true,
  null?
] | [
  false,
  string
];

/** @internal */
export const enum ResultState {
  PASS,
  FAIL
}

export type Validation = [
  ResultState.PASS,
  null | undefined
] | [
  ResultState.FAIL,
  string
];

export const enum ValidatorPriority {
  LOW,
  MEDIUM,
  HIGH
}

export interface ValidationContext {
  value: string;
  attr: string;
  control: FXControl;
}

export type ValidateFunction = (ctx: ValidationContext) => Result | Promise<Result>;

export interface ValidatorSetup {
  name: string;
  priority?: ValidatorPriority;
  attribute: string | string[];
  validate: ValidateFunction;
}

export class Validator {
  readonly name: string;
  readonly priority: ValidatorPriority;
  readonly attrs: string[];

  readonly #validate: ValidateFunction;

  constructor(setup: ValidatorSetup) {
    this.name = setup.name;
    this.priority = setup.priority ?? ValidatorPriority.LOW;
    this.attrs = arrayify(setup.attribute)
      .map((attr) => `fx-${attr}`);

    this.#validate = async (ctx) => setup.validate(ctx);
  }

  async exec(control: FXControl): Promise<Validation> {
    const attr = this.attrs
      .map((attr) => getAttr(control.el, attr))
      .find((val) => val !== null) ?? null;

    if (attr === null) {
      return [
        ResultState.PASS,
        null
      ];
    }

    const [passed, reason] = await this.#validate({
      value: control.el.value,
      attr,
      control
    });

    if (passed) {
      return [
        ResultState.PASS,
        null
      ];
    }

    const customReason = this.attrs
      .map((attr) => getAttr(control.el, attrFailReason(attr)))
      .find((val) => val !== null) ?? null;

    return [
      ResultState.FAIL,
      customReason || reason
    ];
  }
}
