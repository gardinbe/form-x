import { fx } from './global';
import {
  arrayify,
  attrErrorReason,
  attributeObserver,
  getAttr,
  mergeMapsToArray,
  multiAttr,
  setAttr,
  truthyAttr
} from './utils';
import type {
  ValidatorSetup,
  ValidatorSetupAttributed,
  ValidatorSetupFunction,
  ValidatorSetupFunctionAttributed,
  ValidatorSetupFunctionStandalone,
  ValidatorSetupStandalone
} from './validator';
import { ValidationResultState, Validator, ValidatorPriority } from './validator';

export type Revoker = () => void;

declare global {
  interface HTMLInputElement {
    fx: FXControl<HTMLInputElement>;
  }

  interface HTMLTextAreaElement {
    fx: FXControl<HTMLTextAreaElement>;
  }

  interface HTMLSelectElement {
    fx: FXControl<HTMLSelectElement>;
  }
}

export type FXControlElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

export type FXMultiControlElement = HTMLInputElement;

export class FXControl<E extends FXControlElement = FXControlElement> {
  static has<E extends FXControlElement>(node: Node): node is E {
    return (
      'fx' in node
      && node.fx instanceof FXControl
    );
  }

  static isMulti(control: FXControl): control is FXControl<FXMultiControlElement> {
    return FXControl.isMemberEl(control.el);
  }

  static isEl(node: Node): node is FXControlElement {
    return (
      node instanceof HTMLInputElement
      || node instanceof HTMLTextAreaElement
      || node instanceof HTMLSelectElement
    );
  }

  static isMemberEl(node: Node): node is FXMultiControlElement {
    return (
      node instanceof HTMLInputElement
      && (node.type === 'radio'
        || node.type === 'checkbox')
      && !!node.name
    );
  }

  readonly el: E;
  readonly memberEls: Set<E>;

  readonly #errors: Set<string>;
  #valid: boolean;
  #started: boolean;

  readonly #validators: Map<string | symbol, Validator>;
  #revoker: Revoker | null;

  readonly #recurEvents: Set<string>;
  readonly #recurHandler: () => void;
  #listeningRecur: boolean;

  readonly #startEvents: Set<string>;
  readonly #startHandler: () => void;
  #listeningStart: boolean;

  readonly #ao: MutationObserver;

  constructor(el: E) {
    el.fx = this as FXControl<HTMLInputElement>;

    this.el = el;
    this.memberEls = new Set([el]);

    this.#valid = true;
    this.#errors = new Set();
    this.#started = false;

    this.#validators = new Map();
    this.#revoker = null;

    // handle recurring events

    this.#recurEvents = new Set(
      multiAttr(getAttr(el, 'fx-on'))
    );

    this.#recurHandler = (): void => {
      void this.check();
    };

    this.#listeningRecur = false;

    // handle starting events

    this.#startEvents = new Set(
      multiAttr(getAttr(el, 'fx-on:start'))
    );

    this.#startHandler = (): void => {
      this.#start();
      this.#recurHandler();
    };

    this.#listeningStart = false;

    this.#listenStart();

    if (!this.#startEvents.size) {
      this.#start();
    }

    // watch attributes

    this.#ao = attributeObserver(el, this.#handleAttributes.bind(this));

    // init read-only attributes

    this.#valid$ = true;
    this.#checking$ = false;
  }

  get valid(): boolean {
    return this.#valid;
  }

  get errors(): ReadonlySet<string> {
    return this.#errors;
  }

  get validators(): ReadonlyMap<string | symbol, Validator> {
    return this.#validators;
  }

  async check(): Promise<boolean> {
    if (this.#disabled) {
      this.setValid();
      return true;
    }

    if (!this.#started) {
      this.#start();
    }

    this.#checking$ = true;
    this.#removeErrors();

    if (this.#revoker) {
      this.#revoker();
    }

    let revoked = false as boolean;

    this.#revoker = (): void => {
      revoked = true;
    };

    let invalidated = false as boolean;

    const validators = mergeMapsToArray(fx.validators, this.#validators);

    const exec = async (priority: ValidatorPriority): Promise<boolean> => {
      const prioritizedValidators = validators
        .filter((v) => v.priority === priority);

      const validations = prioritizedValidators.map(async (v) => {
        const [state, reason] = await v.exec(this);

        if (
          revoked
          || state !== ValidationResultState.FAIL
        ) {
          return;
        }

        this.setInvalid(reason);
        invalidated = true;
      });

      await Promise.all(validations);

      return (
        !revoked
        && !invalidated
      );
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    await exec(ValidatorPriority.HIGH)
    && await exec(ValidatorPriority.MEDIUM)
    && await exec(ValidatorPriority.LOW);

    if (revoked) {
      return this.#valid;
    }

    if (!invalidated) {
      this.setValid();
    }

    this.#checking$ = false;

    return this.#valid;
  }

  setValid(): void {
    this.#valid = true;
    this.#valid$ = true;

    this.#removeErrors();
  }

  setInvalid(reason?: string): void {
    this.#valid = false;
    this.#valid$ = false;

    if (!reason) {
      return;
    }

    this.#errors.add(reason);

    for (const el of this.#getErrorEls()) {
      el.insertAdjacentHTML(
        'beforeend',
        fx.errorHtmlTemplate(reason)
      );
    }
  }

  #getErrorEls(): NodeListOf<Element> {
    const contextEl = this.el.form ?? document.body;
    return contextEl.querySelectorAll(
      `[fx-errors-for='${this.el.name}']`
    );
  }

  #removeErrors(): void {
    this.#errors.clear();

    for (const el of this.#getErrorEls()) {
      el.replaceChildren();
    }
  }

  addValidator(fn: ValidatorSetupFunctionAttributed): void;
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  addValidator(fn: ValidatorSetupFunctionStandalone): void;
  addValidator(setup: ValidatorSetupAttributed): void;
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  addValidator(setup: ValidatorSetupStandalone): void;
  addValidator(validator: Validator): void;
  addValidator(validator: ValidatorSetupFunction | ValidatorSetup | Validator): void {
    const v = validator instanceof Validator
      ? validator
      : new Validator(validator as ValidatorSetupAttributed);

    this.#validators.set(v.name, v);
  }

  removeValidator(name: string): void;
  removeValidator(validator: Validator): void;
  removeValidator(validator: string | Validator): void {
    const name = validator instanceof Validator
      ? validator.name
      : validator;

    this.#validators.delete(name);
  }

  #start(): void {
    this.#ignoreStart();
    this.#started = true;
    this.#listenRecur();
  }

  #listenRecur(): void {
    if (!this.#started) {
      return;
    }

    for (const el of this.memberEls) {
      for (const ev of this.#recurEvents) {
        el.addEventListener(ev, this.#recurHandler);
      }
    }

    this.#listeningRecur = true;
  }

  #ignoreRecur(): void {
    if (!this.#started) {
      return;
    }

    for (const el of this.memberEls) {
      for (const ev of this.#recurEvents) {
        el.removeEventListener(ev, this.#recurHandler);
      }
    }

    this.#listeningRecur = false;
  }

  #listenStart(): void {
    for (const el of this.memberEls) {
      for (const event of this.#startEvents) {
        el.addEventListener(event, this.#startHandler);
      }
    }

    this.#listeningStart = true;
  }

  #ignoreStart(): void {
    for (const el of this.memberEls) {
      for (const event of this.#startEvents) {
        el.removeEventListener(event, this.#startHandler);
      }
    }

    this.#listeningStart = false;
  }

  #handleAttributes(attr: string): void {
    // TODO: this seems to fire twice, which isn't ideal

    if (attr === 'fx-on') {
      const listening = this.#listeningRecur;

      if (listening) {
        this.#ignoreRecur();
      }

      this.#recurEvents.clear();
      const events = multiAttr(getAttr(this.el, 'fx-on'));

      for (const event of events) {
        this.#recurEvents.add(event);
      }

      if (listening) {
        this.#listenRecur();
      }
    } else if (attr === 'fx-on:start') {
      const listening = this.#listeningStart;

      if (listening) {
        this.#ignoreStart();
      }

      this.#startEvents.clear();
      const events = multiAttr(getAttr(this.el, 'fx-on:start'));

      for (const event of events) {
        this.#startEvents.add(event);
      }

      if (listening) {
        this.#listenStart();
      }
    } else if (
      mergeMapsToArray(fx.validators, this.#validators)
        .flatMap((v) => arrayify(v.attributes))
        .flatMap((a) => a
          ? [a, attrErrorReason(a)]
          : [])
        .concat([
          'disabled',
          'fx-validate',
          'fx-name'
        ])
        .includes(attr)
    ) {
      void this.check();
    }
  }

  destroy(): void {
    this.#ao.disconnect();
    this.#ignoreStart();
    this.#ignoreRecur();
    this.setValid();
  }

  get name(): string {
    return getAttr(this.el, 'fx-name') ?? 'Field';
  }

  get #disabled(): boolean {
    return (
      this.el.disabled
      || !truthyAttr(getAttr(this.el, 'fx-validate'))
    );
  }

  set #valid$(v: boolean) {
    setAttr(this.el, 'fx-valid', `${v}`);
  }

  set #checking$(v: boolean) {
    setAttr(this.el, 'fx-checking', `${v}`);
  }
}
