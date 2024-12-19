import { type MultiControl } from '../controls/multi-control';
import { truthyAttr } from '../utils';
import { Validator, ValidatorPriority } from './validator';

const required = new Validator({
  name: 'required',
  attribute: 'required',
  priority: ValidatorPriority.HIGH,
  validate: ({ value, attrValue, control }) => {
    if (!truthyAttr(attrValue)) {
      return {
        valid: true
      };
    }

    if (
      control.element.type === 'checkbox'
      || control.element.type === 'radio'
    ) {
      const radioControl = control as MultiControl;
      const els = Array.from(radioControl.associatedElements);
      const valid = els.some((el) => el.checked);

      if (!valid) {
        return {
          valid: false,
          reason: `${control.$displayName} is required`
        };
      }

      return {
        valid: true
      };
    }

    if (value.length === 0) {
      return {
        valid: false,
        reason: `${control.$displayName} is required`
      };
    }

    return {
      valid: true
    };
  }
});

const maxLen = new Validator({
  name: 'max-length',
  attribute: 'max-len',
  priority: ValidatorPriority.MEDIUM,
  validate: ({ value, attrValue, control }) => {
    const maxLen = parseInt(attrValue);

    if (isNaN(maxLen)) {
      throw new Error(`${control.$displayName} has an invalid maximum length`);
    }

    if (value.length > maxLen) {
      return {
        valid: false,
        reason: `${control.$displayName} must have no more than ${maxLen} characters`
      };
    }

    return {
      valid: true
    };
  }
});

const minLen = new Validator({
  name: 'min-length',
  attribute: 'min-len',
  priority: ValidatorPriority.MEDIUM,
  validate: ({ value, attrValue, control }) => {
    const minLen = parseInt(attrValue);

    if (isNaN(minLen)) {
      throw new Error(`${control.$displayName} has an invalid minimum length`);
    }

    if (value.length < minLen) {
      return {
        valid: false,
        reason: `${control.$displayName} must have at least ${minLen} characters`
      };
    }

    return {
      valid: true
    };
  }
});

const min = new Validator({
  name: 'min-value',
  attribute: 'min',
  priority: ValidatorPriority.MEDIUM,
  validate: ({ value, attrValue, control }) => {
    const min = parseInt(attrValue);

    if (isNaN(min)) {
      throw new Error(`${control.$displayName} has an invalid minimum value`);
    }

    const val = parseInt(value);

    if (isNaN(val)) {
      return {
        valid: false,
        reason: `${control.$displayName} must be a number`
      };
    }

    if (val < min) {
      return {
        valid: false,
        reason: `${control.$displayName} must be at least ${min}`
      };
    }

    return {
      valid: true
    };
  }
});

const max = new Validator({
  name: 'max-value',
  attribute: 'max',
  priority: ValidatorPriority.MEDIUM,
  validate: ({ value, attrValue, control }) => {
    const max = parseInt(attrValue);

    if (isNaN(max)) {
      throw new Error(`${control.$displayName} has an invalid maximum value`);
    }

    const val = parseInt(value);

    if (isNaN(val)) {
      return {
        valid: false,
        reason: `${control.$displayName} must be a number`
      };
    }

    if (val > max) {
      return {
        valid: false,
        reason: `${control.$displayName} must be at most ${max}`
      };
    }

    return {
      valid: true
    };
  }
});

const pattern = new Validator({
  name: 'pattern',
  attribute: 'pattern',
  priority: ValidatorPriority.LOW,
  validate: ({ value, attrValue, control }) => {
    let pattern;

    try {
      pattern = new RegExp(attrValue);
    } catch {
      throw new Error(`${control.$displayName} has an invalid pattern`);
    }

    if (!pattern.test(value)) {
      return {
        valid: false,
        reason: `${control.$displayName} does not match the required pattern`
      };
    }

    return {
      valid: true
    };
  }
});

interface PatternPreset {
  name: string;
  pattern: RegExp;
}

const patternPresets: PatternPreset[] = [
  {
    name: 'email',
    // eslint-disable-next-line no-control-regex
    pattern: /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
  },
  {
    name: 'phone-number',
    pattern: /^[\s+()\d]*$/
  }
];

const patternPreset = new Validator({
  name: 'pattern-preset',
  attribute: 'pattern-preset',
  priority: ValidatorPriority.LOW,
  validate: ({ value, attrValue, control }) => {
    const presets = attrValue
      .split(':')
      .map((name) => patternPresets
        .find((preset) => preset.name === name))
      .filter((preset): preset is PatternPreset => {
        if (!preset) {
          throw new Error(`${control.$displayName} has an invalid pattern preset`);
        }

        return true;
      });

    const valid = presets
      .every((preset) => preset.pattern.test(value));

    if (!valid) {
      return {
        valid: false,
        reason: `${control.$displayName} does not match the required pattern`
      };
    }

    return {
      valid: true
    };
  }
});

export const CoreValidators = {
  required,
  maxLen,
  minLen,
  min,
  max,
  pattern,
  patternPreset
};
