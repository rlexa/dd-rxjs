import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {DoneSubject} from './done-subject';

describe('DoneSubject', () => {
  test('done() completes', () => {
    const done$ = new DoneSubject();
    expect(done$.isDone()).toBe(false);
    done$.done();
    expect(done$.isDone()).toBe(true);
  });

  test('done() fires', () => {
    const done$ = new DoneSubject();
    const waitFor$ = new Subject<void>();
    const waitSubscription = waitFor$.pipe(takeUntil(done$)).subscribe();
    expect(done$.isDone()).toBe(false);
    expect(waitSubscription.closed).toBe(false);
    done$.done();
    expect(done$.isDone()).toBe(true);
    expect(waitSubscription.closed).toBe(true);
    waitFor$.complete();
  });
});
