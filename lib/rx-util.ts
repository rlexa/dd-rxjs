import {combineLatest, merge, MonoTypeOperatorFunction, Observable, of, Subject, Subscribable} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, map, shareReplay, startWith, switchMap, tap, throttleTime} from 'rxjs/operators';
import {DoneSubject} from './done-subject';

/** JSON equality check. */
export const jsonEqual = <T>(left: T, right: T): boolean => left === right || JSON.stringify(left) === JSON.stringify(right);

/**
 * Type guard normalizing a non empty value.
 *
 * @example
 * ```typescript
 * const state$ = new BehaviorSubject<User | null>(null);
 *
 * const user$ = state$.pipe(filter(notNullUndefined)); // resolves to `User`
 * ```
 */
export const notNullUndefined = <T>(val: T | null | undefined): val is T => val !== null && val !== undefined;

/** @return first valid function's result or null */
export const rxApplyFirst = <T, U>(param: T, funcs: (null | ((val: T) => U))[]) =>
  funcs.find((ii) => typeof ii === 'function')?.(param) ?? null;

/** rxApplyFirst curry */
export const rxApplyFirst_ =
  <T, U>(...funcs: (null | ((val: T) => U))[]) =>
  (val: T) =>
    rxApplyFirst<T, U>(val, funcs);

/** @param check if evaluates to true then func will be executed */
export const rxIfDo = <T>(check: boolean | ((val: T) => boolean), func: (val: T) => void) =>
  tap<T>((val) => ((typeof check === 'function' ? check(val) : check) ? func(val) : {}));

/** @param check if evaluates to true then ex is thrown */
export const rxIfThrow = <T, R>(check: boolean | ((val: T) => boolean), ex: R | ((val: T) => R)) =>
  tap<T>((val) => {
    if (typeof check === 'function' ? check(val) : check) {
      throw typeof ex === 'function' ? (ex as (val: T) => R)(val) : ex;
    }
  });

/** @param subjects will be completed (DoneSubject will also fire next() before completing) */
export const rxComplete = (...subjects: Subject<never | void>[]) =>
  subjects
    .filter((ii) => !!ii)
    .forEach((ii) => {
      if (ii instanceof DoneSubject) {
        ii.done();
      }
      ii.complete();
    });

/** just subscribes (i.e. executes stream) */
export const rxJust = <T>(subscribable: Subscribable<T>) => subscribable.subscribe({});
/** rxJust curry */
export const rxJust_ =
  <T>(subscribable: Subscribable<T>) =>
  () =>
    rxJust(subscribable);

/** executes Subject.next() for all subjects */
export const rxNext = <T>(val: T, subjects: Subject<T>[]) => subjects.forEach((ii) => ii.next(val));
/** rxNext curry */
export const rxNext_ =
  <T>(...subjects: Subject<T>[]) =>
  (arg: T) =>
    rxNext(arg, subjects);

/** next(false) to all subjects */
export const rxFalse = (...subjects: Subject<boolean>[]) => rxNext_(...subjects)(false);
/** rxFalse curry */
export const rxFalse_ =
  (...subjects: Subject<boolean>[]) =>
  () =>
    rxFalse(...subjects);

/** next() to all subjects */
export const rxFire = (...subjects: Subject<void>[]) => subjects.forEach((ii) => ii.next());
/** rxFire curry */
export const rxFire_ =
  (...subjects: Subject<void>[]) =>
  () =>
    rxFire(...subjects);

/** next(null) to all subjects */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rxNull = (...subjects: Subject<any>[]) => rxNext_(...subjects)(null);
/** rxNull curry */
export const rxNull_ =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...subjects: Subject<any>[]) =>
    () =>
      rxNull(...subjects);

/** next(true) to all subjects */
export const rxTrue = (...subjects: Subject<boolean>[]) => rxNext_(...subjects)(true);
/** rxTrue curry */
export const rxTrue_ =
  (...subjects: Subject<boolean>[]) =>
  () =>
    rxTrue(...subjects);

/** `pipe(rxThrounceTime(500))` to stream the start value, smooth `throttleTime` in between and then the end value */
export function rxThrounceTime<T>(ms: number): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) =>
    merge(source.pipe(throttleTime(ms)), source.pipe(debounceTime(ms))).pipe(throttleTime(0, undefined, {leading: true, trailing: false}));
}

/** First subscriber starts stream, others share it, last unsubscriber closes stream. */
export function rxFanOut<T>(): MonoTypeOperatorFunction<T> {
  return shareReplay<T>({refCount: true, bufferSize: 1});
}

/** Stabilizes a stream by wrapping the value to be either `{busy: true}` or `{busy: false, error: unknown}` or `{busy: false, body: T}`. */
export interface RxWrapBusyErrorBody<T> {
  busy: boolean;
  error?: unknown;
  body?: T;
}

/** Prepares a stream value indicating that it's still busy. */
export const rxWrapBusy = <T>(): RxWrapBusyErrorBody<T> => ({busy: true});

/** Prepares a stream value which after busy resulted in an error. */
export const rxWrapError = <T>(error: unknown): RxWrapBusyErrorBody<T> => ({busy: false, error});

/** Prepares a stream value which after busy resulted in data. */
export const rxWrapBody = <T>(body: T): RxWrapBusyErrorBody<T> => ({busy: false, body});

/** Stabilizes a stream to start in busy state and wrap error instead of completing on error. */
export const rxWrapRequest$ = <T>(request$: Observable<T>) =>
  request$.pipe(
    map(rxWrapBody),
    catchError((err) => of(rxWrapError<T>(err))),
    startWith(rxWrapBusy<T>()),
  );

/**
 * Use for stabilized (won't complete on error) request streams which do not need any query parameters.
 *
 * @param cfg takes a `trigger$` (e.g. a `Subject<void>`) serving as reload trigger and API function call
 * @returns stream of busy-then-error-or-data values
 *
 * The stream:
 * - auto-starts on first subscriber, then re-runs on trigger:
 *   - always starts with a busy value
 *   - always waits a frame to debounce multi-triggering in the same frame
 *   - only fires changes of data i.e. if response is json-equal to last time will not continue
 *   - fans out to subscribers (first starts stream, others share same stream, last unsub closes stream)
 *
 * @example
 * ```typescript
 * const triggerReload$ = new Subject<void>();
 *
 * const userConfigStream$ = rxWrapStream({
 *   trigger$: triggerReload$,
 *   apiCall: () => apiService.getUserConfiguration()
 * });
 * ```
 */
export function rxWrapStream<T>(cfg: {trigger$: Observable<unknown>; apiCall: () => Observable<T>}) {
  return cfg.trigger$.pipe(
    startWith('meh'),
    debounceTime(0),
    switchMap(() => rxWrapRequest$(cfg.apiCall())),
    distinctUntilChanged(jsonEqual),
    rxFanOut(),
  );
}

/**
 * Use for stabilized (won't complete on error) request streams which need query parameters.
 *
 * @param cfg takes a `trigger$` (e.g. a `Subject<void>`) serving as reload trigger, query$ `Observable` and API function call
 * @returns stream of busy-then-error-or-data values
 *
 * The stream:
 * - auto-starts on first subscriber after query object is ready and re-runs on trigger:
 *   - always starts with a busy value
 *   - always waits a frame to debounce multi-triggering or query changes in the same frame
 *   - only fires changes of data i.e. if response is json-equal to last time will not continue
 *   - fans out to subscribers (first starts stream, others share same stream, last unsub closes stream)
 *
 * @example
 * ```typescript
 * const triggerReload$ = new Subject<void>();
 * const fromDate$ = new StateSubject<string|null>(null);
 * const toDate$ = new StateSubject<string|null>(null);
 *
 * rxWrapQueriedStream({
 *   trigger$: triggerReload$,
 *   query$: combineLatest([fromDate$, toDate$]),
 *   apiCall: ([from, to]) => apiService.getItems({from, to}),
 * })
 * ```
 */
export function rxWrapQueriedStream<Q, T>(cfg: {
  trigger$: Observable<unknown>;
  query$: Observable<Q>;
  apiCall: (query: Q) => Observable<T>;
}) {
  return combineLatest([cfg.trigger$.pipe(startWith('meh')), cfg.query$]).pipe(
    debounceTime(0),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    switchMap(([_, query]) => rxWrapRequest$(cfg.apiCall(query))),
    distinctUntilChanged(jsonEqual),
    rxFanOut(),
  );
}
