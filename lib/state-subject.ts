import {BehaviorSubject} from 'rxjs';

export class StateSubject<T> extends BehaviorSubject<T> {
  next(value: T) {
    if (this.value !== value) {
      super.next(value);
    }
  }
}
