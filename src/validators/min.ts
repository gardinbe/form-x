import type { ValidatorSetupAttributed } from '../validator';
import { ValidatorPriority } from '../validator';

export const minValue: ValidatorSetupAttributed = {
  name: 'min',
  attribute: 'fx-min',
  priority: ValidatorPriority.MEDIUM,
  fn: (i, ctx): void => {
    const min = Number(ctx.attributeValue);

    if (
      !isFinite(min)
      || min < 0
    ) {
      throw new Error(`${ctx.label} has an invalid minimum value`);
    }

    const val = Number(ctx.value);

    if (
      !isNaN(val)
      && val >= min
    ) {
      return;
    }

    i(`${ctx.label} must be greater than or equal to ${min}`);
  }
};
