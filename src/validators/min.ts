import { Validator, ValidatorPriority } from '../validator/validator';

export const min = new Validator({
  name: 'min-value',
  attribute: 'min',
  priority: ValidatorPriority.MEDIUM,
  validate: ({ value, attr, control }) => {
    const min = parseInt(attr);

    if (isNaN(min)) {
      throw new Error(`${control.name} has an invalid minimum value`);
    }

    const val = parseInt(value);

    if (
      isNaN(val)
      || val < min
    ) {
      return [
        false,
        `${control.name} must be a number greater than or equal to ${min}`
      ];
    }

    return [true];
  }
});
