import './init';

export type {
  FXConfig
} from './config';

export {
  FXControl,
  type FXControlElement,
  type FXMultiControlElement
} from './control/control';

export {
  FXForm,
  type FXFormElement
} from './form/form';

export {
  type Fail,
  type Pass,
  type RevokedValidation,
  type ValidateFn,
  type Validation,
  Validator,
  type ValidatorInstance,
  ValidatorPriority,
  type ValidatorRevoker,
  type ValidatorSetup
} from './validator/validator';

export {
  Validators
} from './validator/core';

export {
  fx
} from './config';
