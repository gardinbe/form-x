import { Validator, ValidatorPriority } from '../validator';

export const maxValue = new Validator({
  name: 'max-value',
  attribute: 'max',
  priority: ValidatorPriority.MEDIUM,
  fn: (i, ctx): void => {
    const max = Number(ctx.attributeValue);

    if (
      !isFinite(max)
      || max < 0
    ) {
      throw new Error(`${ctx.name} has an invalid maximum value`);
    }

    const val = Number(ctx.value);

    if (
      isNaN(val)
      || val > max
    ) {
      i(`${ctx.name} must be a number less than or equal to ${max}`);
    }
  }
});
