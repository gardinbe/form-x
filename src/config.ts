import type { FXControlElement } from './control/control';
import { FXControl } from './control/control';
import type { FXFormElement } from './form/form';
import { FXForm } from './form/form';
import type { ValidatorSetup } from './validator/validator';
import { Validator } from './validator/validator';

export interface FXConfig {
  instances: {
    forms: Map<FXFormElement, FXForm>;
    controls: Map<FXControlElement, FXControl>;
  };
  init(): void;
  registerValidator(validator: Validator | ValidatorSetup): void;
  unregisterValidator(validator: Validator | string): void;
}

declare global {
  interface Window {
    fx: FXConfig;
  }
}

export const fx: FXConfig = {
  instances: {
    forms: new Map(),
    controls: new Map()
  },

  registerValidator(validator) {
    const _validator = validator instanceof Validator
      ? validator
      : new Validator(validator);

    for (const control of this.instances.controls.values()) {
      control.registerValidator(_validator);
    }

    return _validator;
  },

  unregisterValidator(validator) {
    const name = typeof validator === 'string'
      ? validator
      : validator.name;

    for (const control of this.instances.controls.values()) {
      control.unregisterValidator(name);
    }
  },

  init() {
    const controlEls = document
      .querySelectorAll<FXControlElement>('[fx-validate]');

    for (const el of controlEls) {
      this.instances.controls.set(el, new FXControl(el));
    }

    const formEls = document
      .querySelectorAll<FXFormElement>('[fx-form]');

    for (const el of formEls) {
      this.instances.forms.set(el, new FXForm(el));
    }
  }
};

window.fx = fx;
