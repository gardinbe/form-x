/* eslint-disable */

import { fx } from  '../src';

// example

fx.errorHtmlTemplate = (r: string): string =>
  `<li style='color: red;'>${r}</li>`;

fx<HTMLFormElement>('#form')?.el.addEventListener('submit', (ev) => {
  ev.preventDefault();
  alert('Form submitted!');
});

// username validator

fx<HTMLInputElement>('#username')?.add(async (i, ctx) => {
  if (!await checkUsername(ctx.value)) {
    i(`${ctx.label} is not cool`);
  }
});

// is-valid-password validator

fx.add({
  name: 'is-valid-password',
  attribute: 'fx-is-valid-password',
  fn: (i, ctx) => {
    if (ctx.value.length >= 8) return;
    if (!/[A-Z]/.test(ctx.value)) return;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(ctx.value)) return;
    i(`${ctx.label} is not a valid password`);
  }
});

// is-ipv4 pattern preset

fx.addPreset({
  name: 'ipv4',
  pattern: /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/,
  error: (label) => `${label} is not a valid IPv4 address`
});

/**
 * Checks if a username is valid.
 * @param username - Username to check.
 * @returns `true` if the username is valid.
 */
const checkUsername = async (username: string) => {
  await new Promise<void>((res) => setTimeout(res, 1000));
  return username.toLocaleLowerCase().includes('cool');
};
