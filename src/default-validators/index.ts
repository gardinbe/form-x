import { maxValue } from './max';
import { maxLength } from './max-len';
import { minValue } from './min';
import { minLength } from './min-len';
import { pattern } from './pattern';
import { preset } from './preset';
import { required } from './required';

export const defaultValidators = {
  maxValue,
  maxLength,
  minValue,
  minLength,
  pattern,
  preset,
  required
} as const;
