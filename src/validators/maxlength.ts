import type { ValidatorSetupAttributed } from '../validator';
import { ValidatorPriority } from '../validator';

export const maxLength: ValidatorSetupAttributed = {
  name: 'maxlength',
  attribute: 'fx-maxlength',
  priority: ValidatorPriority.MEDIUM,
  fn: (i, ctx): void => {
    const maxLen = Number(ctx.attributeValue);

    if (!Number.isInteger(maxLen)) {
      throw new Error(`${ctx.label} has an invalid maximum length`);
    }

    if (ctx.value.length <= maxLen) {
      return;
    }

    i(`${ctx.label} must have no more than ${maxLen} characters`);
  }
};
