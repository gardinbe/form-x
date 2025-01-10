import { multiAttr } from '../../utils';
import { Validator, ValidatorPriority } from '../validator';

export interface PresetPattern {
  name: string;
  pattern: RegExp;
  error: (dname: string) => string;
}

const presets: PresetPattern[] = [
  {
    name: 'email',
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    error: (dname) => `${dname} is not in a valid format`
  },
  {
    name: 'phone',
    pattern: /^[\s+()\d]*$/,
    error: (dname) => `${dname} is not in a valid format`
  }
];

export const presetPattern = new Validator({
  name: 'preset-pattern',
  attribute: 'preset-pattern',
  priority: ValidatorPriority.LOW,
  validate: ({ value, attr, control }) => {
    const selectedPresets = multiAttr(attr)
      .map((name) => presets
        .find((preset) => preset.name === name))
      .filter((preset): preset is PresetPattern => {
        if (!preset) {
          throw new Error(`${control.$dname} has an invalid pattern preset`);
        }

        return true;
      });

    const valid = selectedPresets
      .every((preset) => preset.pattern.test(value));

    const reason = selectedPresets.length === 1
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ? selectedPresets[0]!.error(control.$dname)
      : `${control.$dname} is not in a valid format`;

    if (!valid) {
      return {
        valid: false,
        reason
      };
    }

    return {
      valid: true
    };
  }
});
