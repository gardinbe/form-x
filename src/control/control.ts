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
import type { ValidatorSetup } from '../validator/validator';
import { ResultState, Validator, ValidatorPriority } from '../validator/validator';
import * as validators from '../validators';

export type Revoker = () => void;

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
  readonly memberEls: Set<FXMultiControlElement>;
  readonly errorsEl: HTMLElement | null;
  readonly errors: Set<string>;
  readonly validators: Map<string, Validator>;
  revoker: Revoker | null;

  #valid: boolean;
  readonly #setValidatorAttrs: WatchAttributesFn;

  #handler: EventListener;
  #listening: boolean;
  readonly #events: Set<string>;
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

        this.#events.clear();

        const events = multiAttr(getAttr(el, 'fx-on'));

        for (const event of events) {
          this.#events.add(event);
        }

        this.#bind();
      }
    );
    this.#setEventAttrs('fx-on');

    this.revoker = null;
    this.validators = new Map(
      Object
        .values(validators)
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
    if (this.disabled) {
      this.setValid();
      return;
    }

    this.$checking = true;
    this.#clearErrors();

    if (this.revoker) {
      this.revoker();
    }

    let revoked = false as boolean;

    this.revoker = () => {
      revoked = true;
    };

    let invalidated = false as boolean;

    const execValidators = async (priority: ValidatorPriority): Promise<boolean> => {
      const validators = Array
        .from(this.validators.values())
        .filter((validator) => validator.priority === priority);

      const validations = validators.map(async (validator) => {
        const [state, reason] = await validator.exec(this);

        if (
          revoked
          || state !== ResultState.FAIL
        ) {
          return;
        }

        this.setInvalid(reason);
        invalidated = true;
      });

      await Promise.all(validations);

      if (
        revoked
        || invalidated
      ) {
        return false;
      }

      return true;
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    await execValidators(ValidatorPriority.HIGH)
    && await execValidators(ValidatorPriority.MEDIUM)
    && await execValidators(ValidatorPriority.LOW);

    if (revoked) {
      return;
    }

    if (!invalidated) {
      this.setValid();
    }

    this.$checking = false;
  }

  setValid() {
    this.#valid = true;
    this.$valid = true;

    this.#clearErrors();
  }

  setInvalid(reason: string) {
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
          'fx-name'
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

  get name(): string {
    return getAttr(this.el, 'fx-name') ?? 'Field';
  }

  get disabled(): boolean {
    return (
      this.el.disabled
      && truthyAttr(getAttr(this.el, 'fx-validate'))
    );
  }

  protected set $valid(value: boolean) {
    setAttr(this.el, 'fx-valid', `${value}`);
  }

  protected set $checking(value: boolean) {
    setAttr(this.el, 'fx-checking', `${value}`);
  }
}
