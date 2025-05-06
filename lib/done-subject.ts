import {Subject} from 'rxjs';

/** @deprecated for Angular context (use Angular native `takeUntilDestroyed(this.destroyRef)` instead) */
export class DoneSubject extends Subject<void> {
  private markDone = false;

  isDone() {
    return this.markDone;
  }

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
