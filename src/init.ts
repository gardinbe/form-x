import type { ControlElement } from './control/control';
import { Control } from './control/control';
import type { FormValidatorElement } from './form/form-validator';
import { FormValidator } from './form/form-validator';

const controlEls = document
  .querySelectorAll<ControlElement>('[fx-validate]');

for (const el of controlEls) {
  new Control(el);
}

const formEls = document
  .querySelectorAll<FormValidatorElement>('[fx-form]');

for (const el of formEls) {
  new FormValidator(el);
}
