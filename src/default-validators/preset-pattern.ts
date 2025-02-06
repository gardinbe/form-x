import { multiAttr } from '../utils';
import { Validator, ValidatorPriority } from '../validator';

export interface PresetPattern {
  name: string;
  pattern: RegExp;
  error(dname: string): string;
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

const getSelectedPresets = (attr: string): PresetPattern[] => {
  return multiAttr(attr)
    .map((n) => presets.find((p) => p.name === n))
    .filter((p): p is PresetPattern => {
      if (!p) {
        throw new Error('Invalid pattern preset');
      }

      return true;
    });
};

export const presetPattern = new Validator({
  name: 'preset-pattern',
  attribute: 'preset-pattern',
  priority: ValidatorPriority.LOW,
  fn: (i, ctx): void => {
    const selectedPresets = getSelectedPresets(ctx.attributeValue);

    const valid = selectedPresets.every((preset) => preset.pattern.test(ctx.value));

    const reason = selectedPresets.length === 1
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ? selectedPresets[0]!.error(ctx.name)
      : `${ctx.name} is not in a valid format`;

    if (!valid) {
      i(reason);
    }
  }
});
