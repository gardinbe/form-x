import type { FXControlElement, FXMultiControlElement } from './control';
import { FXControl } from './control';
import { defaultValidators } from './default-validators';
import type { Preset } from './default-validators/preset';
import { defaultPresets } from './default-validators/preset';
import type { FXFormElement } from './form';
import { FXForm } from './form';
import { childObserver, sanitizeAttrQuery } from './utils';
import type { ValidatorSetupAttributed } from './validator';
import { Validator } from './validator';

export interface FXFunction {
  /**
   * Returns the `FXForm` instance for the given form.
   * @param el - The form element.
   * @returns The `FXForm` instance.
   */
  (el: FXFormElement): FXForm;

  /**
   * Returns the `FXControl` instance for the given control.
   * @param el - The control element.
   * @returns The `FXControl` instance.
   */
  <E extends FXControlElement>(el: E): FXControl<E>;

  /**
   * Returns the `FXForm` or `FXControl` instance for the given element.
   * @param el - The element.
   * @returns The `FXForm` or `FXControl` instance.
   */
  (el: Element): FXForm | FXControl | null;
}

export interface FXGlobal extends FXFunction {
  /**
   * WeakMap of FXForms in the document.
   */
  readonly forms: WeakMap<FXFormElement, FXForm>;

  /**
   * WeakMap of FXControls in the document.
   */
  readonly controls: WeakMap<FXControlElement, FXControl>;

  /**
   * MutationObserver for the document.
   */
  readonly observer: MutationObserver;

  /**
   * Map of global validators, available to all controls.
   */
  readonly validators: ReadonlyMap<string | symbol, Validator>;

  /**
   * Map of presets usable by the `fx-preset` validator.
   */
  readonly presets: ReadonlyMap<string, Preset>;

  /**
   * Adds a validator to the global registry, making it available to all controls.
   *
   * Enabled by setting the given attribute(s) on the target element(s).
   *
   * _If a validator with the same name exists in the global registry_: the given validator will
   * **overwrite** the existing one.
   * @param setup - Validator setup.
   */
  add(setup: ValidatorSetupAttributed): void;

  /**
   * Adds a validator to the global registry, making it available to all controls.
   *
   * Enabled by setting the given validator's attribute(s) on the target element(s).
   *
   * _If a validator with the same name exists in the global registry_: the given validator will
   * **overwrite** the existing one.
   * @param validator - Validator to add.
   */
  add(validator: Validator): void;

  /**
   * Removes a validator from the global registry.
   * @param name - Name of the validator to remove.
   */
  remove(name: string): void;

  /**
   * Removes a validator from the global registry.
   * @param validator - Validator to remove.
   */
  remove(validator: Validator): void;

  /**
   * Defines a preset usable by the `fx-preset` validator.
   * @param preset - Preset to add.
   */
  addPreset(preset: Preset): void;

  /**
   * Removes a preset previously usable by the `fx-preset` validator.
   * @param name - Name of the preset to remove.
   */
  removePreset(name: string): void;

  /**
   * Removes a preset previously usable by the `fx-preset` validator.
   * @param preset - Preset to remove.
   */
  removePreset(preset: Preset): void;

  /**
   * Function to generate the HTML element for a validation error reason.
   * @param reason - Reason for the error.
   */
  errorHtmlTemplate(reason: string): string;
}

// forms and controls

const
  forms: WeakMap<FXFormElement, FXForm> = new WeakMap(),
  controls: WeakMap<FXControlElement, FXControl> = new WeakMap();

// TODO: fix types

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fn: FXFunction = (el: Node): any => {
  if (FXForm.isEl(el)) {
    return forms.get(el) ?? null;
  }

  if (FXControl.isEl(el)) {
    return controls.get(el);
  }

  return null;
};

const createForm = (el: FXFormElement): void => {
  forms.set(el, new FXForm(el));
};

const destroyForm = (el: FXFormElement): void => {
  fn(el).destroy();
  forms.delete(el);
};

const createControl = (el: FXControlElement): void => {
  if (FXControl.isMemberEl(el)) {
    // TODO: watch `type` on controls, as when type changes to
    // radio/checkbox, we need to get all members

    const els = [
      ...el.form
        ? el.form.elements
        : document.querySelectorAll(
          `[type='${sanitizeAttrQuery(el.type)}'][name='${sanitizeAttrQuery(el.name)}']`
        )
    ];

    const controlEl = els
      .find((el): el is FXMultiControlElement =>
        FXControl.isMemberEl(el)
        && el.name === el.name
        && controls.has(el));

    if (controlEl) {
      const control = fn(controlEl);
      controls.set(el, control);
      control.members.add(el);
      return;
    }
  }

  controls.set(el, new FXControl(el));
};

const destroyControl = (el: FXControlElement): void => {
  const control = fn(el);

  if (
    FXControl.isMemberEl(el)
    && control.members.size > 1
  ) {
    if (el === control.el) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (control.el as FXControlElement) = [...control.members].find((m) => m !== el)!;
    }

    control.members.delete(el);
  } else {
    control.destroy();
    controls.delete(el);
  }
};

const observer = childObserver(document.body, ([removed, added]) => {
  for (const el of removed) {
    if (
      FXForm.isEl(el)
      && forms.has(el)
    ) {
      destroyForm(el);
    } else if (
      FXControl.isEl(el)
      && controls.has(el)
    ) {
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

const add = (validator: ValidatorSetupAttributed | Validator): void => {
  const _validator = validator instanceof Validator
    ? validator
    : new Validator(validator);

  validators.set(_validator.name, _validator);
};

const remove = (validator: string | Validator): void => {
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

/**
 * Initializes the forms and controls.
 */
export const init = (): void => {
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

/**
 * The global form-x instance.
 */
export const fx: FXGlobal = Object.assign(fn, {
  forms,
  controls,
  observer,
  validators,
  add,
  remove,
  presets,
  addPreset,
  removePreset,
  errorHtmlTemplate
});

declare global {
  interface Window {
    /**
     * The global form-x instance.
     */
    fx: FXGlobal;
  }
}

window.fx = fx;
