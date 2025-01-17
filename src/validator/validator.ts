import type { FXControl } from '../control/control';
import { arrayify, attrFailReason, getAttr } from '../utils';

export type Validation = Pass | Fail;

export interface RevokedValidation {
  revoked: true;
}

export interface Pass {
  valid: true;
}

export interface Fail {
  valid: false;
  reason: string;
}

export const enum ValidatorPriority {
  LOW,
  MEDIUM,
  HIGH
}

export type ValidatorInstance = Validation | Promise<Validation>;

export type ValidateFn = (ctx: {
  value: string;
  attr: string;
  control: FXControl;
}) => ValidatorInstance;

export type ValidatorRevoker = () => void;

export interface ValidatorSetup {
  name: string;
  priority: ValidatorPriority;
  attribute: string | string[];
  validate: ValidateFn;
}

export class Validator {
  readonly name: string;
  readonly priority: ValidatorPriority;
  readonly attrs: string[];

  readonly #validate: ValidateFn;

  constructor(setup: ValidatorSetup) {
    this.name = setup.name;
    this.priority = setup.priority;
    this.attrs = arrayify(setup.attribute)
      .map((attr) => `fx-${attr}`);

    this.#validate = async (ctx) => setup.validate(ctx);
  }

  async exec(control: FXControl): Promise<Validation | RevokedValidation> {
    const revokePrev = control.validationRevokers.get(this);

    if (revokePrev) {
      revokePrev();
    }

    let revoked = false;

    const revoker: ValidatorRevoker = () => {
      revoked = true;
    };

    const runValidator = async (): Promise<Validation | RevokedValidation> => {
      const attr = this.attrs
        .map((attr) => getAttr(control.el, attr))
        .find((val) => val !== null) ?? null;

      if (attr === null) {
        return {
          valid: true
        };
      }

      const result = await this.#validate({
        value: control.el.value,
        attr,
        control
      });

      const customReason = this.attrs
        .map((attr) => getAttr(control.el, attrFailReason(attr)))
        .find((val) => val !== null) ?? null;

      if (
        customReason
        && !result.valid
      ) {
        result.reason = customReason;
      }

      if (revoked) {
        return {
          revoked: true
        };
      }

      return result;
    };

    const validation = runValidator();

    control.validationRevokers.set(this, revoker);

    const result = await validation;

    control.validationRevokers.delete(this);

    return result;
  }
}
