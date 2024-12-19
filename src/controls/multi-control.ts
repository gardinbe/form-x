import { type Validator } from '../validators/validator';
import { Control } from './control';

export type MultiControlElement = HTMLInputElement;

export class MultiControl<E extends MultiControlElement = MultiControlElement>
  extends Control<MultiControlElement> {
  readonly associatedElements: Set<MultiControlElement>;

  constructor(el: E, validators?: Validator[]) {
    super(el, validators);

    this.associatedElements = new Set(
      el.form
        ? Array
          .from(el.form.elements as HTMLCollectionOf<MultiControlElement>)
          .filter((el) => el.name === this.element.name)
        : []
    );
  }

  override listen() {
    super.listen();

    if (!this.handler) {
      return;
    }

    for (const el of this.associatedElements) {
      el.addEventListener('change', this.handler);
    }
  }

  override ignore() {
    if (!this.handler) {
      return;
    }

    for (const el of this.associatedElements) {
      el.addEventListener('change', this.handler);
    }

    super.ignore();
  }
}
