import { Validator, ValidatorPriority } from '../validator';

export const minLen = new Validator({
  name: 'min-length',
  attr: 'min-len',
  priority: ValidatorPriority.MEDIUM,
  validate: ({ value, attr, control }) => {
    const minLen = parseInt(attr);

    if (isNaN(minLen)) {
      throw new Error(`${control.$dname} has an invalid minimum length`);
    }

    if (value.length < minLen) {
      return {
        valid: false,
        reason: `${control.$dname} must have at least ${minLen} characters`
      };
    }

    return {
      valid: true
    };
  }
});
