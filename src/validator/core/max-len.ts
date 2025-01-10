import { Validator, ValidatorPriority } from '../validator';

export const maxLen = new Validator({
  name: 'max-length',
  attr: 'max-len',
  priority: ValidatorPriority.MEDIUM,
  validate: ({ value, attr, control }) => {
    const maxLen = parseInt(attr);

    if (isNaN(maxLen)) {
      throw new Error(`${control.$dname} has an invalid maximum length`);
    }

    if (value.length > maxLen) {
      return {
        valid: false,
        reason: `${control.$dname} must have no more than ${maxLen} characters`
      };
    }

    return {
      valid: true
    };
  }
});
