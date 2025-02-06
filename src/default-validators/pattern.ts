import { Validator, ValidatorPriority } from '../validator';

export const pattern = new Validator({
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

    if (!pattern.test(ctx.value)) {
      i(`${ctx.name} is not in a valid format`);
    }
  }
});
