import {BehaviorSubject} from 'rxjs';

export class StateSubject<T> extends BehaviorSubject<T> {
  constructor(
    init: T,
    private readonly cfg?: {equal?: (a: T, b: T) => boolean},
  ) {
    super(init);
  }

  next(value: T) {
    if (this.value !== value && !this.cfg?.equal?.(this.value, value)) {
      super.next(value);
    }
  }
}
