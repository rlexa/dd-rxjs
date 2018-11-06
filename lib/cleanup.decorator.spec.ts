import { Subject, Subscription } from 'rxjs';
import { RxCleanup, RxCleanupGlobal } from './cleanup.decorator';
import { DoneSubject } from './done-subject';

class TestContext {
  cleanedUp = false;
  done$ = new DoneSubject();
  subject$ = new Subject();
  sub: Subscription | null = null;

  cleanUp() {
    this.cleanedUp = true;
  }
}

describe('RxCleanup', () => {
  test('cleans up', () => {
    const subj$ = new Subject();
    const instance = new TestContext();
    instance.sub = subj$.subscribe();

    RxCleanupGlobal.funcCleanUp = 'cleanUp';
    RxCleanup()(instance, 'done$');
    RxCleanup()(instance, 'subject$');
    RxCleanup()(instance, 'sub');

    expect(instance.cleanedUp).toBe(false);
    expect(instance.done$.isStopped).toBe(false);
    expect(instance.subject$.isStopped).toBe(false);
    expect(instance.sub.closed).toBe(false);
    instance.cleanUp();
    expect(instance.cleanedUp).toBe(true);
    expect(instance.done$.isStopped).toBe(true);
    expect(instance.subject$.isStopped).toBe(true);
    expect(instance.sub.closed).toBe(true);

    subj$.complete();
  });
});
