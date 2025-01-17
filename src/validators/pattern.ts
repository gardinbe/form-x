import { Validator, ValidatorPriority } from '../validator/validator';

export const pattern = new Validator({
  name: 'pattern',
  attribute: 'pattern',
  priority: ValidatorPriority.LOW,
  validate: ({ value, attr, control }) => {
    let pattern;

    try {
      pattern = new RegExp(attr);
    } catch {
      throw new Error(`${control.name} has an invalid pattern`);
    }

    if (pattern.test(value)) {
      return [
        false,
        `${control.name} is not in a valid format`
      ];
    }

    return [true];
  }
});
