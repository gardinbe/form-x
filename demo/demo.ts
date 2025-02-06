/* eslint-disable */

import { fx } from '../src';

// example

fx.addValidator({
  name: 'username-is-cool',
  attribute: 'username-is-cool',
  async fn(i, ctx) {
    const result = await checkUsername(ctx.value);

    if (!result.valid) {
      i(`${ctx.name} is not cool`);
    }
  }
});

// example async function

const checkUsername = async (username: string) => {
  await new Promise<void>((res) => setTimeout(res, 1000));
  return {
    valid: username.includes('cool')
  };
};
