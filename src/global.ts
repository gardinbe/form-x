import type { ControlEl, FXControlEl, FXMultiControlEl, MultiControlEl } from './control';
import { FXControl } from './control';
import { defaultValidators } from './default-validators';
import type { FormEl, FXFormEl } from './form';
import { FXForm } from './form';
import { childObserver, DOMReady, sanitizeAttrQuery } from './utils';
import type { ValidatorSetup, ValidatorSetupAttributed, ValidatorSetupRaw } from './validator';
import { Validator } from './validator';

export interface FXGlobal {
  readonly forms: WeakMap<FormEl, FXForm>;
  readonly controls: WeakMap<ControlEl, FXControl>;
  readonly observer: MutationObserver;
  readonly validators: ReadonlyMap<string, Validator>;
  addValidator(validator: Validator): void;
  addValidator(setup: ValidatorSetupAttributed): void;
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  addValidator(setup: ValidatorSetupRaw): void;
  removeValidator(validator: Validator): void;
  removeValidator(name: string): void;
}

const
  forms: WeakMap<FormEl, FXForm> = new WeakMap(),
  controls: WeakMap<ControlEl, FXControl> = new WeakMap();

/**
 * Creates a new `FXForm` instance for the given `FormElement`.
 * @param el - The `FormElement` to create a `FXForm` instance for.
 */
const createForm = (el: FormEl): void => {
  (el as FXFormEl).fx = new FXForm(el);
  forms.set(el, (el as FXFormEl).fx);
};

/**
 * Destroys the `FXForm` instance for the given `FormElement`.
 * @param el - The `FormElement` to destroy the `FXForm` instance for.
 */
const destroyForm = (el: FXFormEl): void => {
  el.fx.destroy();
  forms.delete(el);
};

/**
 * Creates a new `FXControl` instance for the given `ControlElement`.
 * @param el - The `ControlElement` to create a `FXControl` instance for.
 */
const createControl = (el: ControlEl): void => {
  if (FXControl.isMemberEl(el)) {
    const els = [
      ...el.form
        ? el.form.elements as HTMLCollectionOf<MultiControlEl>
        : document.querySelectorAll<MultiControlEl>(
          `[type='${sanitizeAttrQuery(el.type)}'][name='${sanitizeAttrQuery(el.name)}']`
        )
    ];

    const control = els
      .find((el): el is FXMultiControlEl =>
        el.name === el.name
        && FXControl.has(el))
      ?.fx;

    if (control) {
      (el as FXMultiControlEl).fx = control;
      control.memberEls.add(el);
      return;
    }
  }

  (el as FXControlEl).fx = new FXControl(el);
  controls.set(el, (el as FXControlEl).fx);
};

/**
 * Destroys the `FXControl` instance for the given `ControlElement`.
 * @param el - The `ControlElement` to destroy the `FXControl` instance for.
 */
const destroyControl = (el: FXControlEl): void => {
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
  const formEls = document.querySelectorAll<FormEl>(
    'form'
  );

  for (const el of formEls) {
    createForm(el);
  }

  const controlEls = document.querySelectorAll<ControlEl>(
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

const validators: Map<string, Validator> = new Map(
  Object
    .values(defaultValidators)
    .map((v) => [v.name, v])
);

const addValidator = (validator: Validator | ValidatorSetup): void => {
  const _validator = validator instanceof Validator
    ? validator
    : new Validator(validator as ValidatorSetupRaw);

  validators.set(_validator.name, _validator);
};

const removeValidator = (validator: Validator | string): void => {
  const name = typeof validator === 'string'
    ? validator
    : validator.name;

  validators.delete(name);
};

export const fx: FXGlobal = {
  forms,
  controls,
  observer,
  validators,
  addValidator,
  removeValidator
};

declare global {
  interface Window {
    fx: FXGlobal;
  }
}

window.fx = fx;
