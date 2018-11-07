import { Subject, Subscription } from 'rxjs';
import { RxCleanup, RxCleanupGlobal } from './cleanup.decorator';
import { DoneSubject } from './done-subject';

class TestContext {
  cleanedUp = false;
  private readonly done$ = new DoneSubject();
  cleanUp() {
    this.cleanedUp = true;
  }
}

class TestContext1 extends TestContext {
  readonly subject$ = new Subject();
  sub: Subscription | null = null;
}

class TestContext2 extends TestContext {
  readonly otherSubject$ = new Subject();
}

describe('RxCleanup', () => {
  test('cleans up', () => {
    const subj$ = new Subject();
    const instance1 = new TestContext1();
    instance1.sub = subj$.subscribe();
    const instance2 = new TestContext2();

    RxCleanupGlobal.funcCleanUp = 'cleanUp';
    RxCleanup()(TestContext.prototype, 'done$');
    RxCleanup()(TestContext1.prototype, 'subject$');
    RxCleanup()(TestContext1.prototype, 'sub');
    RxCleanup()(TestContext2.prototype, 'otherSubject$');

    expect(instance1.cleanedUp).toBe(false);
    expect((instance1 as any).done$.isStopped).toBe(false);
    expect(instance1.subject$.isStopped).toBe(false);
    expect(instance1.sub.closed).toBe(false);
    instance1.cleanUp();
    expect(instance1.cleanedUp).toBe(true);
    expect((instance1 as any).done$.isStopped).toBe(true);
    expect(instance1.subject$.isStopped).toBe(true);
    expect(instance1.sub.closed).toBe(true);

    expect(instance2.cleanedUp).toBe(false);
    expect((instance2 as any).done$.isStopped).toBe(false);
    expect(instance2.otherSubject$.isStopped).toBe(false);
    instance2.cleanUp();
    expect(instance2.cleanedUp).toBe(true);
    expect((instance2 as any).done$.isStopped).toBe(true);
    expect(instance2.otherSubject$.isStopped).toBe(true);

    subj$.complete();
  });
});
