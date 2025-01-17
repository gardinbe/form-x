import { Validator, ValidatorPriority } from '../validator/validator';

export const max = new Validator({
  name: 'max-value',
  attribute: 'max',
  priority: ValidatorPriority.MEDIUM,
  validate: ({ value, attr, control }) => {
    const max = parseInt(attr);

    if (isNaN(max)) {
      throw new Error(`${control.name} has an invalid maximum value`);
    }

    const val = parseInt(value);

    if (
      isNaN(val)
      || val > max
    ) {
      return [
        false,
        `${control.name} must be a number less than or equal to ${max}`
      ];
    }

    return [true];
  }
});
