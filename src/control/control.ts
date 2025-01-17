import {
  arrayify,
  attrFailReason,
  attrWatcher,
  getAttr,
  multiAttr,
  setAttr,
  truthyAttr
} from '../utils';
import type { WatchAttributesFn } from '../utils/watch';
import { Validators } from '../validator/core';
import type { ValidatorRevoker, ValidatorSetup } from '../validator/validator';
import { Validator } from '../validator/validator';

export type FXControlElement = (
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement
) & {
  fx?: FXControl;
};

export type FXMultiControlElement = HTMLInputElement;

export class FXControl<E extends FXControlElement = FXControlElement> {
  readonly el: E;
  readonly memberEls: Set<FXMultiControlElement> = new Set();
  readonly errorsEl: HTMLElement | null;
  readonly errors: Set<string>;
  readonly validators: Map<string, Validator>;
  readonly validationRevokers: Map<Validator, ValidatorRevoker>;

  #valid: boolean;
  readonly #setValidatorAttrs: WatchAttributesFn;

  #handler: EventListener;
  #listening: boolean;
  #events: Set<string>;
  readonly #setEventAttrs: WatchAttributesFn;

  constructor(el: E) {
    el.fx = this;

    this.el = el;
    this.memberEls = new Set(
      el.form
      && (
        el.type === 'radio'
        || el.type === 'checkbox'
      )
        ? Array
          .from(el.form.elements as HTMLCollectionOf<FXMultiControlElement>)
          .filter((el) => el.name === this.el.name)
        : [el as FXMultiControlElement]
    );

    this.#valid = true;
    this.errorsEl = document
      .querySelector(`[fx-errors-for='${el.name}']`);
    this.errors = new Set();

    this.#handler = () => void this.check();
    this.#listening = false;
    this.#events = new Set(
      multiAttr(getAttr(el, 'fx-on'))
    );

    this.#bind();

    this.#setEventAttrs = attrWatcher(
      el,
      () => {
        this.#unbind();

        this.#events = new Set(
          multiAttr(getAttr(el, 'fx-on'))
        );

        this.#bind();
      }
    );
    this.#setEventAttrs('fx-on');

    this.validationRevokers = new Map();
    this.validators = new Map(
      Object
        .values(Validators)
        .map((validator) => [
          validator.name,
          validator
        ])
    );

    this.#setValidatorAttrs = attrWatcher(
      this.el,
      () => void this.check()
    );
    this.#loadValidatorAttrs();

    this.$valid = true;
    this.$checking = false;
  }

  get valid(): boolean {
    return this.#valid;
  }

  async check() {
    if (
      this.$disabled
      || !this.$validate
    ) {
      this.validate();
      return;
    }

    this.$checking = true;

    this.#clearErrors();

    let invalidated = false as boolean;

    await Promise.all(
      Array
        .from(this.validators.values())
        .map(async (validator) => {
          const result = await validator.exec(this);

          if (
            'revoked' in result
            || (
              'valid' in result
              && result.valid
            )
          ) {
            return;
          }

          this.invalidate(result.reason);
          invalidated = true;
        })
    );

    if (!invalidated) {
      this.validate();
    }

    this.$checking = false;
  }

  validate() {
    this.#valid = true;
    this.$valid = true;

    this.#clearErrors();
  }

  invalidate(reason: string) {
    this.#valid = false;
    this.$valid = false;

    this.errors.add(reason);

    if (!this.errorsEl) {
      return;
    }

    const li = document.createElement('li');
    li.textContent = reason;

    this.errorsEl.appendChild(li);
  }

  #clearErrors() {
    this.errors.clear();
    this.errorsEl?.replaceChildren();
  }

  registerValidator(validator: Validator | ValidatorSetup): void {
    const _validator = validator instanceof Validator
      ? validator
      : new Validator(validator);

    this.validators.set(validator.name, _validator);
    this.#loadValidatorAttrs();
  }

  unregisterValidator(validator: Validator | string): void {
    const name = typeof validator === 'string'
      ? validator
      : validator.name;

    this.validators.delete(name);
    this.#loadValidatorAttrs();
  }

  #loadValidatorAttrs() {
    this.#setValidatorAttrs(
      ...Array
        .from(this.validators.values())
        .flatMap((validator) => arrayify(validator.attrs))
        .flatMap((attr) => [
          attr,
          attrFailReason(attr)
        ])
        .concat([
          'disabled',
          'fx-validate',
          'fx-display-name'
        ])
    );
  }

  #bind() {
    if (this.#listening) {
      return;
    }

    for (const el of this.memberEls) {
      for (const ev of this.#events) {
        el.addEventListener(ev, this.#handler);
      }
    }

    this.#listening = true;
  }

  #unbind() {
    if (!this.#listening) {
      return;
    }

    for (const el of this.memberEls) {
      for (const ev of this.#events) {
        el.removeEventListener(ev, this.#handler);
      }
    }

    this.#listening = false;
  }

  get $valid(): boolean {
    return truthyAttr(getAttr(this.el, 'fx-valid'));
  }

  get $checking(): boolean {
    return truthyAttr(getAttr(this.el, 'fx-checking'));
  }

  get $dname(): string {
    return getAttr(this.el, 'fx-display-name') ?? 'Field';
  }

  get $disabled(): boolean {
    return this.el.disabled;
  }

  get $validate(): boolean {
    return truthyAttr(getAttr(this.el, 'fx-validate'));
  }

  protected set $valid(value) {
    setAttr(this.el, 'fx-valid', `${value}`);
  }

  protected set $checking(value) {
    setAttr(this.el, 'fx-checking', `${value}`);
  }
}
