import {
  arrayify,
  attrFailReason,
  getAttr,
  multiAttr,
  setAttr,
  truthyAttr,
  watchAttributes
} from '../utils';
import { Validators } from '../validator/core';
import type { Validator } from '../validator/validator';

export type ControlElement = (
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement
) & {
  validator?: Control;
};

export type MultiControlElement = HTMLInputElement;

export class Control<E extends ControlElement = ControlElement> {
  readonly el: E;
  readonly memberEls: Set<MultiControlElement> = new Set();
  readonly validationRevokers: Map<Validator, () => void>;

  protected _valid: boolean;
  protected readonly _validators: Map<string, Validator>;
  protected readonly _errorsEl: HTMLElement | null;
  protected readonly _errors: Set<string>;

  protected _handler: EventListener;
  protected _listening: boolean;
  protected _events: Set<string>;

  constructor(el: E) {
    el.validator = this;

    this.el = el;
    this.memberEls = new Set(
      el.form && (el.type === 'radio' || el.type === 'checkbox')
        ? Array
          .from(el.form.elements as HTMLCollectionOf<MultiControlElement>)
          .filter((el) => el.name === this.el.name)
        : [el as MultiControlElement]
    );

    this._valid = true;
    this._errorsEl = document
      .querySelector(`[fx-errors-for='${el.name}']`);
    this._errors = new Set();

    this._handler = () => void this.check();
    this._listening = false;
    this._events = new Set(
      multiAttr(getAttr(el, 'fx-on'))
    );

    this.bind();

    this._validators = new Map(
      Object
        .values(Validators)
        .map((validator) => [
          validator.name,
          validator
        ])
    );
    this.validationRevokers = new Map();

    this.$valid = true;
    this.$checking = false;

    watchAttributes(
      el,
      Array
        .from(this._validators.values())
        .flatMap((validator) => arrayify(validator.attrs))
        .flatMap((attr) => [
          attr,
          attrFailReason(attr)
        ])
        .concat([
          'disabled',
          'fx-validate',
          'fx-display-name'
        ]),
      () => void this.check()
    );

    watchAttributes(
      el,
      'fx-on',
      () => {
        this.unbind();

        this._events = new Set(
          multiAttr(getAttr(el, 'fx-on'))
        );

        this.bind();
      }
    );
  }

  get valid() {
    return this._valid;
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

    this.clearErrors();

    let invalidated = false as boolean;

    await Promise.all(
      Array
        .from(this._validators.values())
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

  bind() {
    if (this._listening) {
      console.warn(`Form-X: "${this.$dname}" already has listeners bound; an attempt to rebind listeners was ignored`);
      return;
    }

    for (const el of this.memberEls) {
      for (const ev of this._events) {
        el.addEventListener(ev, this._handler);
      }
    }

    this._listening = true;
  }

  unbind() {
    if (!this._listening) {
      console.warn(`Form-X: "${this.$dname}" has no listeners to unbind; an attempt to unbind listeners was ignored`);
      return;
    }

    for (const el of this.memberEls) {
      for (const ev of this._events) {
        el.removeEventListener(ev, this._handler);
      }
    }

    this._listening = false;
  }

  clearErrors() {
    this._errors.clear();
    this._errorsEl?.replaceChildren();
  }

  validate() {
    this._valid = true;
    this.$valid = true;

    this.clearErrors();
  }

  invalidate(reason: string) {
    this._valid = false;
    this.$valid = false;

    this._errors.add(reason);

    if (!this._errorsEl) {
      return;
    }

    const li = document.createElement('li');
    li.textContent = reason;

    this._errorsEl.appendChild(li);
  }

  get $valid() {
    return truthyAttr(getAttr(this.el, 'fx-valid'));
  }

  protected set $valid(value) {
    setAttr(this.el, 'fx-valid', `${value}`);
  }

  get $checking() {
    return truthyAttr(getAttr(this.el, 'fx-checking'));
  }

  protected set $checking(value) {
    setAttr(this.el, 'fx-checking', `${value}`);
  }

  get $dname() {
    return getAttr(this.el, 'fx-display-name') ?? 'Field';
  }

  get $disabled() {
    return this.el.disabled;
  }

  get $validate() {
    return truthyAttr(getAttr(this.el, 'fx-validate'));
  }
}
