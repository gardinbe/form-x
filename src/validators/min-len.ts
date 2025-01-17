import { Validator, ValidatorPriority } from '../validator/validator';

export const minLen = new Validator({
  name: 'min-length',
  attribute: 'min-len',
  priority: ValidatorPriority.MEDIUM,
  validate: ({ value, attr, control }) => {
    const minLen = parseInt(attr);

    if (isNaN(minLen)) {
      throw new Error(`${control.name} has an invalid minimum length`);
    }

    if (value.length < minLen) {
      return [
        false,
        `${control.name} must have at least ${minLen} characters`
      ];
    }

    return [true];
  }
});
