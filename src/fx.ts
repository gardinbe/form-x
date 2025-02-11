import type { ControlElement, MultiControlElement } from './control';
import { Control } from './control';
import type { FormElement } from './form';
import { Form } from './form';
import { childObserver, query, queryAll, sanitizeAttrQuery } from './utils';
import type { ValidatorSetupAttributed } from './validator';
import { Validator } from './validator';
import { defaultValidators } from './validators';
import type { Preset } from './validators/preset';
import { defaultPresets } from './validators/preset';

export interface FXFunction {
  /**
   * Returns the form-x form instance for the given form element.
   * @param el - The form element.
   * @returns the form-x form instance.
   */
  <E extends FormElement>(el: FormElement): Form<E>;

  /**
   * Returns the form-x control instance for the given control element.
   * @param el - The control element.
   * @returns the form-x control instance.
   */
  <E extends ControlElement>(el: E): Control<E>;

  /**
   * Returns the form-x form or control instance for the given element.
   * @param el - The element.
   * @returns The form-x form or control instance.
   */
  (el: Element): Form | Control | null;

  /**
   * Returns the form-x form or control instance for the given selector.
   * @param selector - The selector.
   * @returns The form-x form or control instance.
   */
  (selector: string): Form | Control | null;

  /**
   * Returns the form-x control instance for the given control selector.
   * @param selector - The control selector.
   * @returns the form-x control instance.
   */
  <E extends ControlElement>(selector: string): Control<E> | null;

  /**
   * Returns the form-x form instance for the given form selector.
   * @param selector - The form selector.
   * @returns the form-x form instance.
   */
  <E extends FormElement>(selector: string): Form<E> | null;
}

export interface FX extends FXFunction {
  /**
   * WeakMap of form-x forms in the document.
   */
  readonly forms: WeakMap<FormElement, Form>;

  /**
   * WeakMap of form-x controls in the document.
   */
  readonly controls: WeakMap<ControlElement, Control>;

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
  forms: WeakMap<FormElement, Form> = new WeakMap(),
  controls: WeakMap<ControlElement, Control> = new WeakMap();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fn: FXFunction = (param: Node | string): any => {
  const el = typeof param === 'string'
    ? query(param)
    : param;

  if (!el) {
    return null;
  }

  if (Form.isEl(el)) {
    return forms.get(el) ?? null;
  }

  if (Control.isEl(el)) {
    return controls.get(el) ?? null;
  }

  return null;
};

const createForm = (el: FormElement): void => {
  forms.set(el, new Form(el));
};

const destroyForm = (el: FormElement): void => {
  fn(el).destroy();
  forms.delete(el);
};

const createControl = (el: ControlElement): void => {
  if (Control.isMemberEl(el)) {
    // TODO: edge case - watch `type` on controls, as when type
    // changes to radio/checkbox, we need to find all members.

    const els = [
      ...el.form
        ? el.form.elements
        : queryAll(
          `[type='${sanitizeAttrQuery(el.type)}'][name='${sanitizeAttrQuery(el.name)}']`
        )
    ];

    const controlEl = els
      .find((el): el is MultiControlElement =>
        Control.isMemberEl(el)
        && el.name === el.name
        && controls.has(el));

    if (controlEl) {
      const control = fn(controlEl);
      controls.set(el, control);
      control.members.add(el);
      return;
    }
  }

  controls.set(el, new Control(el));
};

const destroyControl = (el: ControlElement): void => {
  const control = fn(el);

  if (
    Control.isMemberEl(el)
    && control.members.size > 1
  ) {
    if (el === control.el) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (control.el as ControlElement) = [...control.members].find((m) => m !== el)!;
    }

    control.members.delete(el);
  } else {
    control.destroy();
  }

  controls.delete(el);
};

const observer = childObserver(document.body, ([removed, added]) => {
  for (const el of removed) {
    if (
      Form.isEl(el)
      && forms.has(el)
    ) {
      destroyForm(el);
    } else if (
      Control.isEl(el)
      && controls.has(el)
    ) {
      destroyControl(el);
    }
  }

  for (const el of added) {
    if (Form.isEl(el)) {
      createForm(el);
    } else if (Control.isEl(el)) {
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

const add = (param: ValidatorSetupAttributed | Validator): void => {
  const validator = param instanceof Validator
    ? param
    : new Validator(param);

  validators.set(validator.name, validator);
};

const remove = (param: string | Validator): void => {
  const name = typeof param === 'string'
    ? param
    : param.name;

  validators.delete(name);
};

// presets

const presets: Map<string, Preset> = new Map(
  Object.entries(defaultPresets)
);

const addPreset = (preset: Preset): void => {
  presets.set(preset.name, preset);
};

const removePreset = (param: Preset | string): void => {
  const name = typeof param === 'string'
    ? param
    : param.name;

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
  const formEls = queryAll<FormElement>(
    'form'
  );

  for (const el of formEls) {
    createForm(el);
  }

  const controlEls = queryAll<ControlElement>(
    'input, textarea, select'
  );

  for (const el of controlEls) {
    createControl(el);
  }
};

/**
 * The global form-x instance.
 */
export const fx: FX = Object.assign(fn, {
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
    fx: FX;
  }
}

window.fx = fx;
