import type { ValidatorSetupAttributed } from '../validator';
import { ValidatorPriority } from '../validator';

export const minLength: ValidatorSetupAttributed = {
  name: 'minlength',
  attribute: 'fx-minlength',
  priority: ValidatorPriority.MEDIUM,
  fn: (i, ctx): void => {
    const minLen = Number(ctx.attributeValue);

    if (!Number.isInteger(minLen)) {
      throw new Error(`${ctx.label} has an invalid minimum length`);
    }

    if (ctx.value.length >= minLen) {
      return;
    }

    i(`${ctx.label} must have at least ${minLen} characters`);
  }
};
