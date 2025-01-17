import '../src';

/* eslint-disable */

// register the validator to be used like any of the built in ones, by setting
// the `fx-is-cool` attribute, and optionally the `fx-is-cool-fail` attribute


window.fx.addValidator({
  name: 'is-cool',
  attribute: 'is-cool',
  async validate({ value, control }) {
    await delay(2000);

    if (!value.includes('cool')) {
      return [false, `${control.name} is not cool`];
    }

    return [true];
  }
});

/**
 * Creates an artificial delay.
 * @param duration - Duration of the delay in milliseconds.
 * @returns Promise that resolves after the delay.
 */
const delay = async (duration: number) =>
  new Promise((res) => setTimeout(res, duration));
