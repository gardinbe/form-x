import type { ControlElement, MultiControlElement } from './control/control';
import { Control } from './control/control';
import type { FormValidatorElement } from './form/form-validator';
import { FormValidator } from './form/form-validator';
import { domReady } from './utils';

const init = async () => {
  await domReady;

  const controlEls = document
    .querySelectorAll('[fx-validate]');

  for (const el of controlEls) {
    if (
      'type' in el
      && (
        el.type === 'checkbox'
        || el.type === 'radio'
      )
    ) {
      new Control(el as MultiControlElement);
    } else {
      new Control(el as ControlElement);
    }
  }

  const formEls = document
    .querySelectorAll('[fx-form]');

  for (const el of formEls) {
    new FormValidator(el as FormValidatorElement);
  }
};

void init();
