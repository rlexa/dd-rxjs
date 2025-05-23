import {BehaviorSubject, forkJoin, interval, merge, of, Subject} from 'rxjs';
import {finalize, take, takeLast, tap} from 'rxjs/operators';
import {DoneSubject} from './done-subject';
import {
  rxApplyFirst,
  rxApplyFirst_,
  rxComplete,
  rxFalse,
  rxFalse_,
  rxFanOut,
  rxFire,
  rxFire_,
  rxIfDo,
  rxIfThrow,
  rxJust,
  rxJust_,
  rxNext,
  rxNext_,
  rxNull,
  rxNull_,
  rxThrounceTime,
  rxTrue,
  rxTrue_,
} from './rx-util';

describe('rxjs extension', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  test('rxApplyFirst', () => {
    expect(rxApplyFirst(1, [])).toBe(null);
    expect(rxApplyFirst(1, [(_) => _])).toBe(1);
    expect(rxApplyFirst(1, [(_) => _ + 1, (_) => _])).toBe(2);
    expect(rxApplyFirst(1, [null, (_) => _])).toBe(1);

    expect(rxApplyFirst_()(1)).toBe(null);
    expect(rxApplyFirst_((_) => _)(1)).toBe(1);
    expect(
      rxApplyFirst_(
        (_: number) => _ + 1,
        (_) => _,
      )(1),
    ).toBe(2);
    expect(rxApplyFirst_(null, (_) => _)(1)).toBe(1);
  });

  test('rxFanOut', () => {
    const source$ = new Subject<number>();

    const fnOff = jest.fn();
    const fnFirst = jest.fn();
    const fnOther = jest.fn();

    const stream$ = source$.pipe(finalize(fnOff), rxFanOut());
    const subFirst = stream$.subscribe(fnFirst);

    expect(fnFirst).not.toHaveBeenCalled();
    expect(fnOther).not.toHaveBeenCalled();
    expect(fnOff).not.toHaveBeenCalled();

    source$.next(1);

    expect(fnFirst).toHaveBeenLastCalledWith(1);
    expect(fnOther).not.toHaveBeenCalled();
    expect(fnOff).not.toHaveBeenCalled();

    const subOther = stream$.subscribe(fnOther);

    expect(fnFirst).toHaveBeenLastCalledWith(1);
    expect(fnOther).toHaveBeenLastCalledWith(1);
    expect(fnOff).not.toHaveBeenCalled();

    source$.next(2);

    expect(fnFirst).toHaveBeenLastCalledWith(2);
    expect(fnOther).toHaveBeenLastCalledWith(2);
    expect(fnOff).not.toHaveBeenCalled();

    subFirst.unsubscribe();

    expect(fnFirst).toHaveBeenLastCalledWith(2);
    expect(fnOther).toHaveBeenLastCalledWith(2);
    expect(fnOff).not.toHaveBeenCalled();

    source$.next(3);

    expect(fnFirst).toHaveBeenLastCalledWith(2);
    expect(fnOther).toHaveBeenLastCalledWith(3);
    expect(fnOff).not.toHaveBeenCalled();

    subOther.unsubscribe();

    expect(fnFirst).toHaveBeenLastCalledWith(2);
    expect(fnOther).toHaveBeenLastCalledWith(3);
    expect(fnOff).toHaveBeenCalled();
  });

  test('rxIfDo', () => {
    let temp = 0;
    const func = (val: number) => (temp += val);

    temp = 0;
    of(1).pipe(rxIfDo(false, func)).subscribe();
    expect(temp).toBe(0);
    temp = 0;
    of(1).pipe(rxIfDo(true, func)).subscribe();
    expect(temp).toBe(1);
    temp = 0;
    of(1)
      .pipe(rxIfDo((_) => _ % 2 === 0, func))
      .subscribe();
    expect(temp).toBe(0);
    temp = 0;
    of(1)
      .pipe(rxIfDo((_) => _ % 2 === 1, func))
      .subscribe();
    expect(temp).toBe(1);
  });

  test('rxIfThrow', () => {
    let error = '';

    error = '';
    of(1)
      .pipe(rxIfThrow(false, 'error'))
      .subscribe({error: (_) => (error = _)});
    expect(error).toBe('');
    error = '';
    of(1)
      .pipe(rxIfThrow(true, 'error'))
      .subscribe({error: (_) => (error = _)});
    expect(error).toBe('error');
    error = '';
    of(1)
      .pipe(rxIfThrow((_) => _ % 2 === 0, 'error'))
      .subscribe({error: (_) => (error = _)});
    expect(error).toBe('');
    error = '';
    of(1)
      .pipe(rxIfThrow((_) => _ % 2 === 1, 'error'))
      .subscribe({error: (_) => (error = _)});
    expect(error).toBe('error');
  });

  test('rxComplete single', () => {
    const s1 = new Subject<void>();
    jest.spyOn(s1, 'complete');
    expect(s1.complete).not.toHaveBeenCalled();
    rxComplete(s1);
    expect(s1.complete).toHaveBeenCalled();
  });

  test('rxComplete multi', () => {
    const s1 = new Subject<void>();
    const s2 = new Subject<void>();
    jest.spyOn(s1, 'complete');
    jest.spyOn(s2, 'complete');
    rxComplete(s1, s2);
    expect(s1.complete).toHaveBeenCalled();
    expect(s2.complete).toHaveBeenCalled();
  });

  test('rxComplete DoneSubject', () => {
    const done = new DoneSubject();
    let temp = 0;
    done.subscribe(() => ++temp);

    jest.spyOn(done, 'done');

    expect(done.done).not.toHaveBeenCalled();
    rxComplete(done);
    expect(done.done).toHaveBeenCalled();
    expect(temp).toBe(1);
  });

  test('rxJust', () => {
    let temp = 0;
    const set$ = of(1).pipe(tap((_) => (temp = _)));

    temp = 0;
    rxJust(set$);
    expect(temp).toBe(1);
    temp = 0;
    rxJust_(set$)();
    expect(temp).toBe(1);
  });

  test('rxNext', () => {
    const s1 = new BehaviorSubject(0);
    const s2 = new BehaviorSubject(0);

    expect(s1.value).toBe(0);
    rxNext(1, [s1]);
    expect(s1.value).toBe(1);

    expect(s2.value).toBe(0);
    of(2).subscribe(rxNext_(s1, s2));
    expect(s1.value).toBe(2);
    expect(s2.value).toBe(2);

    s1.complete();
    s2.complete();
  });

  test('rxFalse', () => {
    const s1 = new BehaviorSubject(true);
    const s2 = new BehaviorSubject(true);

    expect(s1.value).toBe(true);
    rxFalse(s1);
    expect(s1.value).toBe(false);

    s1.next(true);
    expect(s1.value).toBe(true);
    expect(s2.value).toBe(true);
    of(null).subscribe(rxFalse_(s1, s2));
    expect(s1.value).toBe(false);
    expect(s2.value).toBe(false);

    s1.complete();
    s2.complete();
  });

  test('rxTrue', () => {
    const s1 = new BehaviorSubject(false);
    const s2 = new BehaviorSubject(false);

    expect(s1.value).toBe(false);
    rxTrue(s1);
    expect(s1.value).toBe(true);

    s1.next(false);
    expect(s1.value).toBe(false);
    expect(s2.value).toBe(false);
    of(null).subscribe(rxTrue_(s1, s2));
    expect(s1.value).toBe(true);
    expect(s2.value).toBe(true);

    s1.complete();
    s2.complete();
  });

  test('rxNull', () => {
    const s1 = new BehaviorSubject<Date | null>(new Date());
    const s2 = new BehaviorSubject<string | null>('hello');

    expect(s1.value).not.toBeNull();
    rxNull(s1);
    expect(s1.value).toBeNull();

    s1.next(new Date());
    expect(s1.value).not.toBeNull();
    expect(s2.value).not.toBeNull();
    of(null).subscribe(rxNull_(s1, s2));
    expect(s1.value).toBeNull();
    expect(s2.value).toBeNull();

    s1.complete();
    s2.complete();
  });

  test('rxFire', () => {
    const s1 = new Subject<void>();
    const s2 = new Subject<void>();

    let temp = 0;
    merge(s1, s2).subscribe(() => ++temp);

    expect(temp).toBe(0);
    rxFire(s1, s2);
    expect(temp).toBe(2);
    of(null).subscribe(rxFire_(s1, s2));
    expect(temp).toBe(4);

    s1.complete();
    s2.complete();
  });

  test('rxThrounceTime', (done) => {
    const vals1 = [] as number[];
    const vals2 = [] as number[];
    const vals3 = [] as number[];
    const vals4 = [] as number[];
    forkJoin([
      interval(100).pipe(
        take(13),
        rxThrounceTime(500),
        tap((_) => vals1.push(_)),
        takeLast(1),
      ),
      interval(100).pipe(
        take(1),
        rxThrounceTime(500),
        tap((_) => vals2.push(_)),
        takeLast(1),
      ),
      interval(100).pipe(
        take(2),
        rxThrounceTime(500),
        tap((_) => vals3.push(_)),
        takeLast(1),
      ),
      interval(100).pipe(
        take(11),
        rxThrounceTime(500),
        tap((_) => vals4.push(_)),
        takeLast(1),
      ),
    ]).subscribe({
      complete: () => {
        expect(vals1).toEqual([0, 6, 12]);
        expect(vals2).toEqual([0]);
        expect(vals3).toEqual([0, 1]);
        expect(vals4).toEqual([0, 6, 10]);
        done();
      },
    });

    jest.advanceTimersByTime(10000);
  });
});
