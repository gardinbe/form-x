/* eslint-disable */

import '../src';

// example

const username = document.querySelector<HTMLInputElement>('#username')!;

username.fx.addValidator(async (i, ctx) => {
  const result = await checkUsername(ctx.value);

  if (!result.valid) {
    i(`${ctx.name} is not cool`);
  }
});

// example async function

const checkUsername = async (username: string) => {
  await new Promise<void>((res) => setTimeout(res, 1000));
  return {
    valid: username.includes('cool')
  };
};
