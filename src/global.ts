import type { FXControlElement, FXMultiControlElement } from './control';
import { FXControl } from './control';
import { defaultValidators } from './default-validators';
import type { Preset } from './default-validators/preset';
import { defaultPresets } from './default-validators/preset';
import type { FXFormElement } from './form';
import { FXForm } from './form';
import { childObserver, DOMReady, sanitizeAttrQuery } from './utils';
import type {
  ValidatorSetup,
  ValidatorSetupAttributed,
  ValidatorSetupStandalone
} from './validator';
import { Validator } from './validator';

export interface FXGlobal {
  readonly forms: WeakMap<FXFormElement, FXForm>;
  readonly controls: WeakMap<FXControlElement, FXControl>;
  readonly observer: MutationObserver;

  readonly validators: ReadonlyMap<string | symbol, Validator>;
  addValidator(setup: ValidatorSetupAttributed): void;
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  addValidator(setup: ValidatorSetupStandalone): void;
  addValidator(validator: Validator): void;
  removeValidator(name: string): void;
  removeValidator(validator: Validator): void;

  readonly presets: ReadonlyMap<string, Preset>;
  addPreset(preset: Preset): void;
  removePreset(name: string): void;
  removePreset(preset: Preset): void;

  errorHtmlTemplate(reason: string): string;
}

// forms and controls

const
  forms: WeakMap<FXFormElement, FXForm> = new WeakMap(),
  controls: WeakMap<FXControlElement, FXControl> = new WeakMap();

/**
 * Creates a new `FXForm` instance for the given `FormElement`.
 * @param el - The `FormElement` to create a `FXForm` instance for.
 */
const createForm = (el: FXFormElement): void => {
  el.fx = new FXForm(el);
  forms.set(el, el.fx);
};

/**
 * Destroys the `FXForm` instance for the given `FormElement`.
 * @param el - The `FormElement` to destroy the `FXForm` instance for.
 */
const destroyForm = (el: FXFormElement): void => {
  el.fx.destroy();
  forms.delete(el);
};

/**
 * Creates a new `FXControl` instance for the given `ControlElement`.
 * @param el - The `ControlElement` to create a `FXControl` instance for.
 */
const createControl = (el: FXControlElement): void => {
  if (FXControl.isMemberEl(el)) {
    const els = [
      ...el.form
        ? el.form.elements as HTMLCollectionOf<FXMultiControlElement>
        : document.querySelectorAll<FXMultiControlElement>(
          `[type='${sanitizeAttrQuery(el.type)}'][name='${sanitizeAttrQuery(el.name)}']`
        )
    ];

    const control = els
      .find((el): el is FXMultiControlElement =>
        el.name === el.name
        && FXControl.has(el))
      ?.fx;

    if (control) {
      el.fx = control;
      control.memberEls.add(el);
      return;
    }
  }

  el.fx = new FXControl(el as HTMLInputElement);
  controls.set(el, el.fx);
};

/**
 * Destroys the `FXControl` instance for the given `ControlElement`.
 * @param el - The `ControlElement` to destroy the `FXControl` instance for.
 */
const destroyControl = (el: FXControlElement): void => {
  if (
    FXControl.isMemberEl(el)
    && el !== el.fx.el
  ) {
    el.fx.memberEls.delete(el);
  } else {
    el.fx.destroy();
    controls.delete(el);
  }
};

const init = (): void => {
  const formEls = document.querySelectorAll<FXFormElement>(
    'form'
  );

  for (const el of formEls) {
    createForm(el);
  }

  const controlEls = document.querySelectorAll<FXControlElement>(
    'input, textarea, select'
  );

  for (const el of controlEls) {
    createControl(el);
  }
};

void DOMReady.then(init);

const observer = childObserver(document.body, ([removed, added]) => {
  for (const el of removed) {
    if (FXForm.has(el)) {
      destroyForm(el);
    } else if (FXControl.has(el)) {
      destroyControl(el);
    }
  }

  for (const el of added) {
    if (FXForm.isEl(el)) {
      createForm(el);
    } else if (FXControl.isEl(el)) {
      createControl(el);
    }
  }
});

// validators

const validators: Map<string | symbol, Validator> = new Map(
  Object
    .values(defaultValidators)
    .map((v) => [v.name, new Validator(v)])
);

const addValidator = (validator: ValidatorSetup | Validator): void => {
  const _validator = validator instanceof Validator
    ? validator
    : new Validator(validator as ValidatorSetupAttributed);

  validators.set(_validator.name, _validator);
};

const removeValidator = (validator: string | Validator): void => {
  const name = typeof validator === 'string'
    ? validator
    : validator.name;

  validators.delete(name);
};

// presets

const presets: Map<string, Preset> = new Map(
  Object.entries(defaultPresets)
);

const addPreset = (preset: Preset): void => {
  presets.set(preset.name, preset);
};

const removePreset = (preset: Preset | string): void => {
  const name = typeof preset === 'string'
    ? preset
    : preset.name;

  presets.delete(name);
};

// templates

const errorHtmlTemplate = (reason: string): string => {
  return /* html */`<li>${reason}</li>`;
};

export const fx: FXGlobal = {
  forms,
  controls,
  observer,
  validators,
  addValidator,
  removeValidator,
  presets,
  addPreset,
  removePreset,
  errorHtmlTemplate
};

declare global {
  interface Window {
    fx: FXGlobal;
  }
}

window.fx = fx;
