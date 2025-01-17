import { Validator, ValidatorPriority } from '../validator/validator';

export const maxLen = new Validator({
  name: 'max-length',
  attribute: 'max-len',
  priority: ValidatorPriority.MEDIUM,
  validate: ({ value, attr, control }) => {
    const maxLen = parseInt(attr);

    if (isNaN(maxLen)) {
      throw new Error(`${control.name} has an invalid maximum length`);
    }

    if (value.length > maxLen) {
      return [
        false,
        `${control.name} must have no more than ${maxLen} characters`
      ];
    }

    return [true];
  }
});
