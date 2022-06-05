import {Subject} from 'rxjs';

export class DoneSubject extends Subject<void> {
  private markDone = false;

  isDone = () => this.markDone;

  complete() {
    this.markDone = true;
    super.complete();
  }

  done() {
    if (!this.markDone) {
      this.markDone = true;
      this.next();
      this.complete();
    }
  }
}
