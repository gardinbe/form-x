/* eslint-disable */

import type { ControlElement } from '../src';
import { Validator, ValidatorPriority } from '../src';

const email = document.querySelector<ControlElement>(
  'input[name="email"]'
);

// create a custom validator

const cool = new Validator({
  name: 'is-cool',
  priority: ValidatorPriority.MEDIUM,
  attribute: 'is-cool',
  async validate({ value, control }) {
    await delay(2000);

    if (!value.includes('cool')) {
      return { valid: false, reason: `${control.$dname} is not cool` };
    }

    return { valid: true };
  }
});

// then register it with a control

email!.validator!.addValidator(cool);

// and now this validator can be used like any of the built in ones, by setting
// the `fx-is-cool` attribute, and optionally the `fx-is-cool-fail` attribute

/**
 * Creates an artificial delay.
 * @param duration - Duration of the delay in milliseconds.
 * @returns Promise that resolves after the delay.
 */
const delay = async (duration: number) =>
  new Promise((res) => setTimeout(res, duration));
