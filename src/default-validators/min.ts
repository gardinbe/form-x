import { Validator, ValidatorPriority } from '../validator';

export const minValue = new Validator({
  name: 'min-value',
  attribute: 'min',
  priority: ValidatorPriority.MEDIUM,
  fn: (i, ctx): void => {
    const min = Number(ctx.attributeValue);

    if (
      !isFinite(min)
      || min < 0
    ) {
      throw new Error(`${ctx.name} has an invalid minimum value`);
    }

    const val = Number(ctx.value);

    if (
      isNaN(val)
      || val < min
    ) {
      i(`${ctx.name} must be a number greater than or equal to ${min}`);
    }
  }
});
