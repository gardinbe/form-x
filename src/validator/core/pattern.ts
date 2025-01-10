import { Validator, ValidatorPriority } from '../validator';

export const pattern = new Validator({
  name: 'pattern',
  attribute: 'pattern',
  priority: ValidatorPriority.LOW,
  validate: ({ value, attr, control }) => {
    let pattern;

    try {
      pattern = new RegExp(attr);
    } catch {
      throw new Error(`${control.$dname} has an invalid pattern`);
    }

    if (!pattern.test(value)) {
      return {
        valid: false,
        reason: `${control.$dname} is not in a valid format`
      };
    }

    return {
      valid: true
    };
  }
});
