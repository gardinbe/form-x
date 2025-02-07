/* eslint-disable */

import { fx } from  '../src';

// example

fx.errorHtmlTemplate = (r: string): string =>
  `<li style='color: red;'>${r}</li>`;

fx<HTMLFormElement>('#form').el.addEventListener('submit', (ev) => {
  ev.preventDefault();
  alert('Form submitted!');
});

// username validator


fx<HTMLInputElement>('#username').add(async (i, ctx) => {
  if (!await checkUsername(ctx.value)) {
    i(`${ctx.name} is not cool`);
  }
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
