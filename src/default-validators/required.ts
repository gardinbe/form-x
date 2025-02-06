import { FXControl } from '../control';
import { truthyAttr } from '../utils';
import { Validator, ValidatorPriority } from '../validator';

export const required = new Validator({
  name: 'required',
  attribute: 'required',
  priority: ValidatorPriority.HIGH,
  fn: (i, ctx): void => {
    if (!truthyAttr(ctx.attributeValue)) {
      return;
    }

    const valid = FXControl.isMulti(ctx.control)
      ? [...ctx.control.memberEls]
        .some((el) => el.checked)
      : !!ctx.value.length;

    if (!valid) {
      i(`${ctx.name} is required`);
    }
  }
});
