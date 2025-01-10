import { Validator, ValidatorPriority } from '../validator';

export const min = new Validator({
  name: 'min-value',
  attr: 'min',
  priority: ValidatorPriority.MEDIUM,
  validate: ({ value, attr, control }) => {
    const min = parseInt(attr);

    if (isNaN(min)) {
      throw new Error(`${control.$dname} has an invalid minimum value`);
    }

    const val = parseInt(value);

    if (
      isNaN(val)
      || val < min
    ) {
      return {
        valid: false,
        reason: `${control.$dname} must be a number greater than or equal to ${min}`
      };
    }

    return {
      valid: true
    };
  }
});
