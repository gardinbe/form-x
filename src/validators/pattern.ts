import type { ValidatorSetupAttributed } from '../validator';
import { ValidatorPriority } from '../validator';

export const pattern: ValidatorSetupAttributed = {
  name: 'pattern',
  attribute: 'fx-pattern',
  priority: ValidatorPriority.LOW,
  fn: (i, ctx): void => {
    let pattern;

    try {
      pattern = new RegExp(ctx.attributeValue);
    } catch {
      throw new Error(`${ctx.label} has an invalid pattern`);
    }

    if (pattern.test(ctx.value)) {
      return;
    }

    i(`${ctx.label} is not valid`);
  }
};
