import { fx } from '../global';
import { multiAttr } from '../utils';
import type { ValidatorSetupAttributed } from '../validator';
import { ValidatorPriority } from '../validator';

export interface Preset {
  name: string;
  pattern: RegExp;
  error(dname: string): string;
}

export const defaultPresets: Record<string, Preset> = {
  email: {
    name: 'email',
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    error: (dname) => `${dname} is not in a valid format`
  },
  phone: {
    name: 'phone',
    pattern: /^[\s+()\d]*$/,
    error: (dname) => `${dname} is not in a valid format`
  }
};

const getSelectedPresets = (attr: string): Preset[] => {
  const presets = [...fx.presets.values()];
  return multiAttr(attr)
    .map((n) => presets.find((p) => p.name === n))
    .filter((p): p is Preset => {
      if (!p) {
        throw new Error('Invalid preset');
      }

      return true;
    });
};

export const preset: ValidatorSetupAttributed = {
  name: 'preset',
  attribute: 'fx-preset',
  priority: ValidatorPriority.LOW,
  fn: (i, ctx): void => {
    const selectedPresets = getSelectedPresets(ctx.attributeValue);
    const valid = selectedPresets.every((p) => p.pattern.test(ctx.value));
    const reason = selectedPresets.length === 1
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ? selectedPresets[0]!.error(ctx.name)
      : `${ctx.name} is not in a valid format`;

    if (valid) {
      return;
    }

    i(reason);
  }
};
