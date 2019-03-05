import { merge, MonoTypeOperatorFunction, Observable, Subject, Subscribable } from 'rxjs';
import { debounceTime, tap, throttleTime } from 'rxjs/operators';
import { DoneSubject } from './done-subject';

export * from './cleanup.decorator';
export * from './done-subject';
export * from './worker-observable';

/** @return first valid function's result or null */
export const rxApplyFirst = <T, U>(param: T, funcs: Array<null | ((val: T) => U)>) => {
  const func = funcs.find(_ => typeof (_) === 'function');
  if (func) {
    return func(param);
  }
  return null;
}

/** rxApplyFirst curry */
export const rxApplyFirst_ = <T, U>(...funcs: Array<null | ((val: T) => U)>) => (val: T) => rxApplyFirst<T, U>(val, funcs);

/** @param check if evaluates to true then func will be executed */
export const rxIfDo = <T>(check: boolean | ((val: T) => boolean), func: (val: T) => void) =>
  tap<T>(val => (typeof check === 'function' ? check(val) : check) ? func(val) : {});

/** @param check if evaluates to true then ex is thrown */
export const rxIfThrow = <T, R>(check: boolean | ((val: T) => boolean), ex: R | ((val: T) => R)) =>
  tap<T>(val => {
    if (typeof check === 'function' ? check(val) : check) {
      throw typeof ex === 'function' ? (ex as (val: T) => R)(val) : ex;
    }
  });

/** @param subjects will be completed (DoneSubject will also fire next() before completing) */
export const rxComplete = (...subjects: Array<Subject<any>>) => subjects.filter(ii => !!ii && !ii.isStopped).forEach(ii => {
  if (ii instanceof DoneSubject) {
    ii.done();
  }
  ii.complete();
});

/** just subscribes (i.e. executes stream) */
export const rxJust = <T>(subscribable: Subscribable<T>) => subscribable.subscribe();
/** rxJust curry */
export const rxJust_ = <T>(subscribable: Subscribable<T>) => () => rxJust(subscribable);

/** executes Subject.next() for all subjects */
export const rxNext = <T>(val: T, subjects: Array<Subject<T>>) => subjects.forEach(ii => ii.next(val));
/** rxNext curry */
export const rxNext_ = <T>(...subjects: Array<Subject<T>>) => (arg: T) => rxNext(arg, subjects);

/** next(false) to all subjects */
export const rxFalse = (...subjects: Array<Subject<boolean>>) => rxNext_(...subjects)(false);
/** rxFalse curry */
export const rxFalse_ = (...subjects: Array<Subject<boolean>>) => () => rxFalse(...subjects);

/** next() to all subjects */
export const rxFire = (...subjects: Array<Subject<{}>>) => subjects.forEach(ii => ii.next());
/** rxFire curry */
export const rxFire_ = (...subjects: Array<Subject<{}>>) => () => rxFire(...subjects);

/** next(null) to all subjects */
export const rxNull = (...subjects: Array<Subject<any>>) => rxNext_(...subjects)(null);
/** rxNull curry */
export const rxNull_ = (...subjects: Array<Subject<any>>) => () => rxNull(...subjects);

/** next(true) to all subjects */
export const rxTrue = (...subjects: Array<Subject<boolean>>) => rxNext_(...subjects)(true);
/** rxTrue curry */
export const rxTrue_ = (...subjects: Array<Subject<boolean>>) => () => rxTrue(...subjects);

/** `pipe(rxThrounceTime(500))` to stream the start value, smooth `throttleTime` in between and then the end value */
export function rxThrounceTime<T>(ms: number): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>) => merge(source.pipe(throttleTime(ms)), source.pipe(debounceTime(ms)))
    .pipe(throttleTime(0, undefined, { leading: true, trailing: false }));
}
