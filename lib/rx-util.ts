import {merge, MonoTypeOperatorFunction, Observable, Subject, Subscribable} from 'rxjs';
import {debounceTime, tap, throttleTime} from 'rxjs/operators';
import {DoneSubject} from './done-subject';

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
