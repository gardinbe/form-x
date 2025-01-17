import './init';

export * as validators from './validators';

export type {
  FXConfig
} from './config';

export {
  FXControl,
  type FXControlElement,
  type FXMultiControlElement,
  type Revoker
} from './control/control';

export {
  FXForm,
  type FXFormElement
} from './form/form';

export {
  type Result,
  ResultState,
  type ValidateFunction,
  type Validation,
  type ValidationContext,
  Validator,
  ValidatorPriority,
  type ValidatorSetup
} from './validator/validator';

export {
  fx
} from './config';
