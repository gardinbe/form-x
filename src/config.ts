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
  addValidator(validator: Validator | ValidatorSetup): void;
  removeValidator(validator: Validator | string): void;
}

export const fx: FXConfig = {
  instances: {
    forms: new Map(),
    controls: new Map()
  },

  addValidator(validator) {
    const _validator = validator instanceof Validator
      ? validator
      : new Validator(validator);

    for (const control of this.instances.controls.values()) {
      control.registerValidator(_validator);
    }

    return _validator;
  },

  removeValidator(validator) {
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

declare global {
  interface Window {
    fx: FXConfig;
  }
}

window.fx = fx;
