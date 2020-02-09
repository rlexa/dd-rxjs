import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {DoneSubject} from './done-subject';

describe('DoneSubject', () => {
  test('done() completes', () => {
    const done$ = new DoneSubject();
    expect(done$.isStopped).toBe(false);
    done$.done();
    expect(done$.isStopped).toBe(true);
  });

  test('done() fires', () => {
    const done$ = new DoneSubject();
    const waitFor$ = new Subject();
    const waitSubscription = waitFor$.pipe(takeUntil(done$)).subscribe();
    expect(done$.isStopped).toBe(false);
    expect(waitFor$.isStopped).toBe(false);
    expect(waitSubscription.closed).toBe(false);
    done$.done();
    expect(done$.isStopped).toBe(true);
    expect(waitFor$.isStopped).toBe(false);
    expect(waitSubscription.closed).toBe(true);
    waitFor$.complete();
    expect(waitFor$.isStopped).toBe(true);
  });
});
