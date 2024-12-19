import { type Control } from '../controls/control';
import { attr } from '../utils';

export type Result = PassedResult | FailedResult;

export interface PassedResult {
  valid: true;
}

export interface FailedResult {
  valid: false;
  reason: string;
}

export const enum ValidationState {
  COMPLETED,
  CANCELLED
}

export type Validation = CompletedValidation | CancelledValidation;

export interface CompletedValidation<R extends Result = Result> {
  state: ValidationState.COMPLETED;
  result: R;
}

export interface CancelledValidation {
  state: ValidationState.CANCELLED;
}

export const enum ValidatorPriority {
  LOW,
  MEDIUM,
  HIGH
}

export interface ValidatorSetup {
  name: string;
  priority: ValidatorPriority;
  attribute: string | string[];
  validate(ctx: {
    value: string;
    attrValue: string;
    control: Control;
  }): Result | Promise<Result>;
}

export class Validator {
  readonly setup: ValidatorSetup;
  private _current: { cancel: () => void } | null;

  constructor(setup: ValidatorSetup) {
    this.setup = setup;
    this._current = null;
  }

  async run(control: Control): Promise<Validation> {
    if (this._current) {
      this._current.cancel();
    }

    let aborted = false;

    const cancel = () => {
      aborted = true;
    };

    const createValidation = async (): Promise<Result> => {
      const attrArray = Array.isArray(this.setup.attribute)
        ? this.setup.attribute
        : [this.setup.attribute];

      const attrValue = attrArray
        .find((a) => attr(control.element, a) !== null) ?? null;

      if (attrValue === null) {
        return {
          valid: true
        };
      }

      const result = await this.setup.validate({
        value: control.element.value,
        attrValue,
        control
      });

      if (aborted) {
        throw new Error('Aborted');
      }

      return result;
    };

    const validation = createValidation();

    this._current = { cancel };

    let result;

    try {
      result = await validation;
    } catch {
      return {
        state: ValidationState.CANCELLED
      };
    }

    this._current = null;

    return {
      state: ValidationState.COMPLETED,
      result
    };
  }
}
