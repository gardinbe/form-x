import { Control } from '../control';
import { truthyAttr } from '../utils';
import type { ValidatorSetupAttributed } from '../validator';
import { ValidatorPriority } from '../validator';

export const required: ValidatorSetupAttributed = {
  name: 'required',
  attribute: 'fx-required',
  priority: ValidatorPriority.HIGH,
  fn: (i, ctx): void => {
    if (!truthyAttr(ctx.attributeValue)) {
      return;
    }

    const valid = Control.isMulti(ctx.control)
      ? [...ctx.control.members]
        .some((el) => el.checked)
      : !!ctx.value.length;

    if (valid) {
      return;
    }

    i(`${ctx.label} is required`);
  }
};
