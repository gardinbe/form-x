import type { ValidatorSetupAttributed } from '../validator';
import { ValidatorPriority } from '../validator';

export const minLength: ValidatorSetupAttributed = {
  name: 'min-length',
  attribute: 'minlength',
  priority: ValidatorPriority.MEDIUM,
  fn: (i, ctx): void => {
    const minLen = Number(ctx.attributeValue);

    if (!Number.isInteger(minLen)) {
      throw new Error(`${ctx.name} has an invalid minimum length`);
    }

    if (ctx.value.length >= minLen) {
      return;
    }

    i(`${ctx.name} must have at least ${minLen} characters`);
  }
};
