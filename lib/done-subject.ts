import { Subject } from 'rxjs';

export class DoneSubject extends Subject<void> {
  done() {
    if (!this.isStopped) {
      this.next();
      this.complete();
    }
  }
}
