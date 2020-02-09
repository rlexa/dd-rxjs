import {Subject, Subscription} from 'rxjs';
import {RxCleanup} from './cleanup.decorator';
import {DoneSubject} from './done-subject';

class TestContext {
  cleanedUp = 0;
  private readonly done$ = new DoneSubject();
  ngOnDestroy() {
    ++this.cleanedUp;
  }
}

class TestContext1 extends TestContext {
  readonly subject$ = new Subject();
  sub: Subscription | null = null;
  ngOnDestroy() {
    super.ngOnDestroy();
  }
}

class TestContext2 extends TestContext {
  readonly otherSubject$ = new Subject();
  ngOnDestroy() {
    super.ngOnDestroy();
  }
}

describe('RxCleanup', () => {
  test('cleans up', () => {
    const subj$ = new Subject();
    const instance1 = new TestContext1();
    instance1.sub = subj$.subscribe();
    const instance2 = new TestContext2();

    RxCleanup()(TestContext.prototype, 'done$');
    RxCleanup()(TestContext1.prototype, 'subject$');
    RxCleanup()(TestContext1.prototype, 'sub');
    RxCleanup()(TestContext2.prototype, 'otherSubject$');

    expect(instance1.cleanedUp).toBe(0);
    expect((instance1 as any).done$.isStopped).toBe(false);
    expect(instance1.subject$.isStopped).toBe(false);
    expect(instance1.sub.closed).toBe(false);
    instance1.ngOnDestroy();
    expect(instance1.cleanedUp).toBe(1);
    expect((instance1 as any).done$.isStopped).toBe(true);
    expect(instance1.subject$.isStopped).toBe(true);
    expect(instance1.sub.closed).toBe(true);

    expect(instance2.cleanedUp).toBe(0);
    expect((instance2 as any).done$.isStopped).toBe(false);
    expect(instance2.otherSubject$.isStopped).toBe(false);
    instance2.ngOnDestroy();
    expect(instance2.cleanedUp).toBe(1);
    expect((instance2 as any).done$.isStopped).toBe(true);
    expect(instance2.otherSubject$.isStopped).toBe(true);

    subj$.complete();
  });
});
