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
  ValidatorFunction,
  ValidatorSetup,
  ValidatorSetupAttributed,
  ValidatorSetupStandalone
} from './validator';
import { ValidationState, Validator, ValidatorPriority } from './validator';

export type CheckRevoker = () => void;

export type FXControlElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

export type FXMultiControlElement = HTMLInputElement;

/**
 * A form-x control.
 */
export class FXControl<E extends FXControlElement = FXControlElement> {
  /**
   * Checks if the given control is a multi control (a radio or checkbox).
   * @returns `true` if the control is a multi control.
   */
  static isMulti(control: FXControl): control is FXControl<FXMultiControlElement> {
    return FXControl.isMemberEl(control.el);
  }

  /**
   * Checks if the given node is a control element.
   * @returns `true` if the node is a control element.
   */
  static isEl(node: Node): node is FXControlElement {
    return (
      node instanceof HTMLInputElement
      || node instanceof HTMLTextAreaElement
      || node instanceof HTMLSelectElement
    );
  }

  /**
   * Checks if the given node is a member control element.
   * @returns `true` if the node is a member control element.
   */
  static isMemberEl(node: Node): node is FXMultiControlElement {
    return (
      node instanceof HTMLInputElement
      && (node.type === 'radio'
        || node.type === 'checkbox')
      && !!node.name
    );
  }

  /**
   * The element the instance is attached to.
   */
  readonly el: E;

  /**
   * The member elements the instance is attached to.
   */
  readonly members: Set<E>;

  readonly #errors: Set<string>;
  #valid: boolean;
  #started: boolean;

  readonly #validators: Map<string | symbol, Validator>;
  #revoker: CheckRevoker | null;

  readonly #recurEvents: Set<string>;
  readonly #recurHandler: () => void;
  #listeningRecur: boolean;

  readonly #startEvents: Set<string>;
  readonly #startHandler: () => void;
  #listeningStart: boolean;

  readonly #ao: MutationObserver;

  /**
   * Creates a new form-x control.
   *
   * **Note**: Control elements in the document will already have a form-x control instance: you
   * won't need to create one.
   * @param el - Element to attach the instance to.
   */
  constructor(el: E) {
    this.el = el;
    this.members = new Set([el]);

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
      this.start();
      this.#recurHandler();
    };

    this.#listeningStart = false;

    this.#listenStart();

    if (!this.#startEvents.size) {
      this.start();
    }

    // watch attributes

    this.#ao = attributeObserver(el, this.#handleAttributes.bind(this));

    // init read-only attributes

    this.#valid$ = true;
    this.#checking$ = false;
  }

  /**
   * The current validity of the control.
   *
   * **Note**: This is the known validity of the control _since it was last checked_, not
   * necessarily the current validity.
   *
   * To get the current validity, use `check()`.
   */
  get valid(): boolean {
    return this.#valid;
  }

  /**
   * Set of the current errors on the control.
   */
  get errors(): ReadonlySet<string> {
    return this.#errors;
  }

  /**
   * Set of the current validators on the control.
   */
  get validators(): ReadonlyMap<string | symbol, Validator> {
    return this.#validators;
  }

  /**
   * Checks the validity of the control.
   * @returns Promise that resolves to `true` if the control is valid.
   */
  async check(): Promise<boolean> {
    if (this.#disabled) {
      this.setValid();
      return true;
    }

    if (!this.#started) {
      this.start();
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

    const run = async (priority: ValidatorPriority): Promise<boolean> => {
      const prioritizedValidators = validators
        .filter((v) => v.priority === priority);

      const validations = prioritizedValidators.map(async (v) => {
        const [state, reason] = await v.run(this);

        if (
          revoked
          || state !== ValidationState.FAIL
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
    await run(ValidatorPriority.HIGH)
    && await run(ValidatorPriority.MEDIUM)
    && await run(ValidatorPriority.LOW);

    if (revoked) {
      return this.#valid;
    }

    if (!invalidated) {
      this.setValid();
    }

    this.#checking$ = false;

    return this.#valid;
  }

  /**
   * Sets the control to be valid.
   */
  setValid(): void {
    this.#valid = true;
    this.#valid$ = true;

    this.#removeErrors();
  }

  /**
   * Sets the control to be invalid.
   * @param reason - Reason for invalidation.
   */
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

  /**
   * Adds a validator to the control.
   * @param fn - Validator function.
   */
  add(fn: ValidatorFunction): void;

  /**
   * Adds a validator to the control.
   *
   * Enabled by setting the given attribute(s) on the target element(s).
   *
   * _If a validator with the same name exists in the global registry_: the given validator will
   * **override** the one in the global registry.
   *
   * _If a validator with the same name exists on the control_: the given validator will
   * **overwrite** the existing one.
   * @param setup - Validator setup.
   */
  add(setup: ValidatorSetupAttributed): void;

  /**
   * Adds a validator to the control.
   *
   * _If a validator with the same name exists in the global registry_: the given validator will
   * **override** the one in the global registry.
   *
   * _If a validator with the same name exists on the control_: the given validator will
   * **overwrite** the existing one.
   * @param setup - Validator setup.
   */
  add(setup: ValidatorSetupStandalone): void;

  /**
   * Adds a validator to the control.
   *
   * Enabled by setting the given validator's attribute(s) on the target element(s).
   *
   * _If a validator with the same name exists in the global registry_: the given validator will
   * **override** the one in the global registry.
   *
   * _If a validator with the same name exists on the control_: the given validator will
   * **overwrite** the existing one.
   * @param validator - Validator to add.
   */
  add(validator: Validator): void;

  add(validator: ValidatorFunction | ValidatorSetup | Validator): void {
    const v = validator instanceof Validator
      ? validator
      : new Validator(validator as ValidatorSetupAttributed);

    this.#validators.set(v.name, v);
  }

  /**
   * Removes a validator from the control.
   * @param name - Name of the validator to remove.
   */
  remove(name: string): void;

  /**
   * Removes a validator from the control.
   * @param validator - Validator to remove.
   */
  remove(validator: Validator): void;

  remove(validator: string | Validator): void {
    const name = validator instanceof Validator
      ? validator.name
      : validator;

    this.#validators.delete(name);
  }

  /**
   * Triggers the control to start listening for recurring events.
   */
  start(): void {
    this.#ignoreStart();
    this.#started = true;
    this.#listenRecur();
  }

  /**
   * Destroys the instance.
   *
   * Removes all event listeners and disconnects observers.
   */
  destroy(): void {
    this.#ao.disconnect();
    this.#ignoreStart();
    this.#ignoreRecur();
    this.setValid();
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

  #listenRecur(): void {
    if (!this.#started) {
      return;
    }

    for (const el of this.members) {
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

    for (const el of this.members) {
      for (const ev of this.#recurEvents) {
        el.removeEventListener(ev, this.#recurHandler);
      }
    }

    this.#listeningRecur = false;
  }

  #listenStart(): void {
    for (const el of this.members) {
      for (const event of this.#startEvents) {
        el.addEventListener(event, this.#startHandler);
      }
    }

    this.#listeningStart = true;
  }

  #ignoreStart(): void {
    for (const el of this.members) {
      for (const event of this.#startEvents) {
        el.removeEventListener(event, this.#startHandler);
      }
    }

    this.#listeningStart = false;
  }

  #handleAttributes(attr: string): void {
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

  /**
   * The name of the control.
   */
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
