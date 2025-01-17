import { truthyAttr } from '../utils';
import { Validator, ValidatorPriority } from '../validator/validator';

export const required = new Validator({
  name: 'required',
  attribute: 'required',
  priority: ValidatorPriority.HIGH,
  validate: ({ value, attr, control }) => {
    if (!truthyAttr(attr)) {
      return [true];
    }

    if (
      control.el.type === 'checkbox'
      || control.el.type === 'radio'
    ) {
      const valid = Array
        .from(control.memberEls)
        .some((el) => el.checked);

      if (!valid) {
        return [
          false,
          `${control.name} is required`
        ];
      }

      return [true];
    }

    if (value.length === 0) {
      return [
        false,
        `${control.name} is required`
      ];
    }

    return [true];
  }
});
