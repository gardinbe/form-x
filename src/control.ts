import { fx } from './fx';
import {
  arrayify,
  attrErrorReason,
  attributeObserver,
  delAttribute,
  getAttribute,
  mergeMapsToArray,
  multiAttr,
  off,
  on,
  queryAll,
  setAttribute,
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

export type ControlElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

export type MultiControlElement = HTMLInputElement;

/**
 * A form-x control.
 */
export class Control<E extends ControlElement = ControlElement> {
  /**
   * Checks if the given control is a multi control (a radio or checkbox).
   * @returns `true` if the control is a multi control.
   */
  static isMulti(control: Control): control is Control<MultiControlElement> {
    return Control.isMemberEl(control.el);
  }

  /**
   * Checks if the given node is a control element.
   * @returns `true` if the node is a control element.
   */
  static isEl(node: Node): node is ControlElement {
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
  static isMemberEl(node: Node): node is MultiControlElement {
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

  readonly #repeatEvents: Set<string>;
  readonly #repeatHandler: () => void;
  #listeningRepeat: boolean;

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

    // handle repeating events

    this.#repeatEvents = new Set(
      multiAttr(getAttribute(el, 'fx-on'))
    );

    this.#repeatHandler = (): void => {
      void this.check();
    };

    this.#listeningRepeat = false;

    // handle starting events

    this.#startEvents = new Set(
      multiAttr(getAttribute(el, 'fx-start-on'))
    );

    this.#startHandler = (): void => {
      this.start();
      this.#repeatHandler();
    };

    this.#listeningStart = false;

    this.#listenStart();

    if (!this.#startEvents.size) {
      this.start();
    }

    // watch attributes

    this.#ao = attributeObserver(el, this.#checkAttribute.bind(this));

    // init state attributes

    this.#setState('fx-valid', !this.inactive ? this.valid : null);
    this.#setState('fx-checking', !this.inactive ? false : null);
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
   * The `fx-name` attribute of the control.
   */
  get name(): string {
    return getAttribute(this.el, 'fx-name') ?? 'Field';
  }

  /**
   * Whether the control is inactive.
   */
  get inactive(): boolean {
    return (
      this.el.disabled
        || !truthyAttr(getAttribute(this.el, 'fx-validate'))
    );
  }

  /**
   * Checks the validity of the control.
   * @returns Promise that resolves to `true` if the control is valid.
   */
  async check(): Promise<boolean> {
    if (this.inactive) {
      this.#setState('fx-valid', null);
      this.#setState('fx-checking', null);
      this.setValid();
      return true;
    }

    if (!this.#started) {
      this.start();
    }

    this.#setState('fx-checking', true);
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
      const group = validators
        .filter((v) => v.priority === priority);

      const validations = group.map(async (v) => {
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

    this.#setState('fx-checking', false);

    return this.#valid;
  }

  /**
   * Sets the control to be valid.
   */
  setValid(): void {
    this.#valid = true;
    this.#setState('fx-valid', true);

    this.#removeErrors();
  }

  /**
   * Sets the control to be invalid.
   * @param reason - Reason for invalidation.
   */
  setInvalid(reason?: string): void {
    this.#valid = false;
    this.#setState('fx-valid', false);

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

  add(param: ValidatorFunction | ValidatorSetup | Validator): void {
    const validator = param instanceof Validator
      ? param
      : new Validator(param as ValidatorSetupAttributed);

    this.#validators.set(validator.name, validator);
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

  remove(param: string | Validator): void {
    const name = param instanceof Validator
      ? param.name
      : param;

    this.#validators.delete(name);
  }

  /**
   * Triggers the control to start listening for repeating events.
   */
  start(): void {
    this.#ignoreStart();
    this.#started = true;
    this.#listenRepeat();
  }

  /**
   * Destroys the instance.
   *
   * Removes all event listeners, disconnects observers and removes all state attributes.
   */
  destroy(): void {
    this.#ao.disconnect();
    this.#ignoreStart();
    this.#ignoreRepeat();

    this.#setState('fx-valid', null);
    this.#setState('fx-checking', null);
  }

  #removeErrors(): void {
    this.#errors.clear();

    for (const el of this.#getErrorEls()) {
      el.replaceChildren();
    }
  }

  #getErrorEls(): HTMLElement[] {
    const contextEl = this.el.form ?? document.body;
    return queryAll(
        `[fx-errors='${this.el.name}']`,
        contextEl
    );
  }

  #listenRepeat(): void {
    if (!this.#started) {
      return;
    }

    for (const el of this.members) {
      for (const ev of this.#repeatEvents) {
        on(el, ev, this.#repeatHandler);
      }
    }

    this.#listeningRepeat = true;
  }

  #ignoreRepeat(): void {
    if (!this.#started) {
      return;
    }

    for (const el of this.members) {
      for (const ev of this.#repeatEvents) {
        off(el, ev, this.#repeatHandler);
      }
    }

    this.#listeningRepeat = false;
  }

  #listenStart(): void {
    for (const el of this.members) {
      for (const event of this.#startEvents) {
        on(el, event, this.#startHandler);
      }
    }

    this.#listeningStart = true;
  }

  #ignoreStart(): void {
    for (const el of this.members) {
      for (const event of this.#startEvents) {
        off(el, event, this.#startHandler);
      }
    }

    this.#listeningStart = false;
  }

  #checkAttribute(attr: string): void {
    if (
      attr === 'disabled'
      || attr === 'fx-validate'
    ) {
      this.#setState('fx-valid', !this.inactive ? this.valid : null);
      this.#setState('fx-checking', !this.inactive ? false : null);
    } else if (attr === 'fx-on') {
      const listening = this.#listeningRepeat;

      if (listening) {
        this.#ignoreRepeat();
      }

      this.#repeatEvents.clear();
      const events = multiAttr(getAttribute(this.el, 'fx-on'));

      for (const event of events) {
        this.#repeatEvents.add(event);
      }

      if (listening) {
        this.#listenRepeat();
      }
    } else if (attr === 'fx-start-on') {
      const listening = this.#listeningStart;

      if (listening) {
        this.#ignoreStart();
      }

      this.#startEvents.clear();
      const events = multiAttr(getAttribute(this.el, 'fx-start-on'));

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

  #setState(attr: string, value: boolean | null): void {
    if (value === null) {
      delAttribute(this.el, attr);
      return;
    }

    setAttribute(this.el, attr, `${value}`);
  }
}
