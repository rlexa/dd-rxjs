import { Subject, Subscription } from 'rxjs';
import { RxCleanup, RxCleanupGlobal } from './cleanup.decorator';
import { DoneSubject } from './done-subject';

class TestContext1 {
  cleanedUp = false;
  done$ = new DoneSubject();
  subject$ = new Subject();
  sub: Subscription | null = null;

  cleanUp() {
    this.cleanedUp = true;
  }
}

class TestContext2 {
  cleanedUp = false;
  done$ = new DoneSubject();
  otherSubject$ = new Subject();

  cleanUp() {
    this.cleanedUp = true;
  }
}

describe('RxCleanup', () => {
  test('cleans up', () => {
    const subj$ = new Subject();
    const instance1 = new TestContext1();
    instance1.sub = subj$.subscribe();
    const instance2 = new TestContext2();

    RxCleanupGlobal.funcCleanUp = 'cleanUp';
    RxCleanup()(instance1, 'done$');
    RxCleanup()(instance1, 'subject$');
    RxCleanup()(instance1, 'sub');
    RxCleanup()(instance2, 'done$');
    RxCleanup()(instance2, 'otherSubject$');

    expect(instance1.cleanedUp).toBe(false);
    expect(instance1.done$.isStopped).toBe(false);
    expect(instance1.subject$.isStopped).toBe(false);
    expect(instance1.sub.closed).toBe(false);
    instance1.cleanUp();
    expect(instance1.cleanedUp).toBe(true);
    expect(instance1.done$.isStopped).toBe(true);
    expect(instance1.subject$.isStopped).toBe(true);
    expect(instance1.sub.closed).toBe(true);

    expect(instance2.cleanedUp).toBe(false);
    expect(instance2.otherSubject$.isStopped).toBe(false);
    instance2.cleanUp();
    expect(instance2.cleanedUp).toBe(true);
    expect(instance2.otherSubject$.isStopped).toBe(true);

    subj$.complete();
  });
});
