import type { ValidatorSetupAttributed } from '../validator';
import { ValidatorPriority } from '../validator';

export const pattern: ValidatorSetupAttributed = {
  name: 'pattern',
  attribute: 'pattern',
  priority: ValidatorPriority.LOW,
  fn: (i, ctx): void => {
    let pattern;

    try {
      pattern = new RegExp(ctx.attributeValue);
    } catch {
      throw new Error(`${ctx.name} has an invalid pattern`);
    }

    if (pattern.test(ctx.value)) {
      return;
    }

    i(`${ctx.name} is not valid`);
  }
};
