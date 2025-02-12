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
import { Validator, ValidatorPriority, ValidityState } from './validator';

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
  #checking: boolean;
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

    this.#errors = new Set();
    this.#valid = true;
    this.#checking = false;
    this.#started = false;

    // validators

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
      multiAttr(getAttribute(el, 'fx-start-on') || 'blur')
    );

    this.#startHandler = (): void => {
      this.start();
      this.#repeatHandler();
    };

    this.#listeningStart = false;
    this.#listenStart();

    // watch attributes

    this.#ao = attributeObserver(el, this.#checkAttribute.bind(this));

    // set initial attributes

    this.#setAria('aria-required', truthyAttr(getAttribute(this.el, 'fx-required')));
    this.#setAria('aria-valuemin', getAttribute(this.el, 'fx-min'));
    this.#setAria('aria-valuemax', getAttribute(this.el, 'fx-max'));
    this.#getErrorEls();
  }

  /**
   * The last-checked validity of the control.
   *
   * **Note**: This is the validity of the control _since it was last checked_, not necessarily the
   * current validity.
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
   * The `fx-label` attribute of the control.
   */
  get label(): string {
    return getAttribute(this.el, 'fx-label') ?? 'Field';
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
      this.setValid();
      return true;
    }

    if (!this.#started) {
      this.start();
    }

    this.#checking = true;
    this.#set('fx-checking', true);

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
          || state !== ValidityState.INVALID
        ) {
          return;
        }

        this.setInvalid(reason ?? undefined);
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

    this.#checking = false;
    this.#set('fx-checking', false);

    return this.#valid;
  }

  /**
   * Sets the control to be valid.
   */
  setValid(): void {
    this.#valid = true;

    this.#setAria('aria-invalid', false);
    this.#set('fx-invalid', false);
    this.#set('fx-valid', true);

    this.#removeErrors();
  }

  /**
   * Sets the control to be invalid.
   * @param reason - Reason for invalidation.
   */
  setInvalid(reason?: string): void {
    this.#valid = false;

    this.#setAria('aria-invalid', true);
    this.#set('fx-valid', false);
    this.#set('fx-invalid', true);

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
    this.#set('fx-started', true);
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

    this.#setAria('aria-invalid', null);
    this.#set('fx-started', false);
    this.#set('fx-valid', false);
    this.#set('fx-invalid', false);
    this.#set('fx-checking', false);
  }

  #removeErrors(): void {
    this.#errors.clear();

    for (const el of this.#getErrorEls()) {
      el.replaceChildren();
    }
  }

  #getErrorEls(): HTMLElement[] {
    const els = queryAll(
      `[fx-errors='${this.el.name}']`,
      this.el.form ?? document.body
    );

    for (const el of els) {
      el.replaceChildren();
      el.id ||= crypto.randomUUID();
      el.role ||= 'alert';
      el.ariaLive ||= 'assertive';
    }

    const ids = els
      .map((el) => el.id)
      .filter((id) => !!id)
      .join(' ');

    if (ids) {
      this.#setAria('aria-describedby', ids);
    }

    return els;
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
      for (const ev of this.#startEvents) {
        on(el, ev, this.#startHandler);
      }
    }

    this.#listeningStart = true;
  }

  #ignoreStart(): void {
    for (const el of this.members) {
      for (const ev of this.#startEvents) {
        off(el, ev, this.#startHandler);
      }
    }

    this.#listeningStart = false;
  }

  #checkAttribute(attr: string): void {
    switch (attr) {
      case 'disabled':
      case 'fx-validate':
        this.#setAria('aria-invalid', !this.valid);
        this.#set('fx-started', this.#started);
        this.#set('fx-valid', this.#started && this.valid);
        this.#set('fx-invalid', this.#started && !this.valid);
        this.#set('fx-checking', this.#checking);
        break;

      case 'fx-on': {
        const listening = this.#listeningRepeat;

        if (listening) {
          this.#ignoreRepeat();
        }

        this.#repeatEvents.clear();
        const events = multiAttr(getAttribute(this.el, 'fx-on'));

        for (const ev of events) {
          this.#repeatEvents.add(ev);
        }

        if (listening) {
          this.#listenRepeat();
        }

        break;
      }

      case 'fx-start-on': {
        const listening = this.#listeningStart;

        if (listening) {
          this.#ignoreStart();
        }

        this.#startEvents.clear();
        const events = multiAttr(getAttribute(this.el, 'fx-start-on'));

        for (const ev of events) {
          this.#startEvents.add(ev);
        }

        if (listening) {
          this.#listenStart();
        }

        break;
      }

      case 'fx-required':
        this.#setAria('aria-required', truthyAttr(getAttribute(this.el, 'fx-required')));
        break;

      case 'fx-min':
        this.#setAria('aria-valuemin', getAttribute(this.el, 'fx-min'));
        break;

      case 'fx-max':
        this.#setAria('aria-valuemax', getAttribute(this.el, 'fx-max'));
        break;
    }

    if (!this.#started) {
      return;
    }

    const validatorAttrs = mergeMapsToArray(fx.validators, this.#validators)
      .flatMap((v) => arrayify(v.attributes))
      .filter((a): a is string => !!a)
      .flatMap((a) => [a, attrErrorReason(a)])
      .concat([
        'disabled',
        'fx-validate',
        'fx-label'
      ]);

    if (!validatorAttrs.includes(attr)) {
      return;
    }

    void this.check();
  }

  #set(attr: `fx-${string}`, value: boolean): void {
    if (
      !this.inactive
      && value
    ) {
      setAttribute(this.el, attr, '');
    } else {
      delAttribute(this.el, attr);
    }
  }

  #setAria(attr: `aria-${string}`, value: boolean | string | number | null): void {
    if (value !== null) {
      setAttribute(this.el, attr, `${!this.inactive && value}`);
    } else {
      delAttribute(this.el, attr);
    }
  }
}
