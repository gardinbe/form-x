import { truthyAttr } from '../../utils';
import { Validator, ValidatorPriority } from '../validator';

export const required = new Validator({
  name: 'required',
  attr: 'required',
  priority: ValidatorPriority.HIGH,
  validate: ({ value, attr, control }) => {
    if (!truthyAttr(attr)) {
      return {
        valid: true
      };
    }

    if (
      control.el.type === 'checkbox'
      || control.el.type === 'radio'
    ) {
      const valid = Array
        .from(control.memberEls)
        .some((el) => el.checked);

      if (!valid) {
        return {
          valid: false,
          reason: `${control.$dname} is required`
        };
      }

      return {
        valid: true
      };
    }

    if (value.length === 0) {
      return {
        valid: false,
        reason: `${control.$dname} is required`
      };
    }

    return {
      valid: true
    };
  }
});
