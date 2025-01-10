import { Validator, ValidatorPriority } from '../validator';

export const max = new Validator({
  name: 'max-value',
  attribute: 'max',
  priority: ValidatorPriority.MEDIUM,
  validate: ({ value, attr, control }) => {
    const max = parseInt(attr);

    if (isNaN(max)) {
      throw new Error(`${control.$dname} has an invalid maximum value`);
    }

    const val = parseInt(value);

    if (
      isNaN(val)
      || val > max
    ) {
      return {
        valid: false,
        reason: `${control.$dname} must be a number less than or equal to ${max}`
      };
    }

    return {
      valid: true
    };
  }
});
