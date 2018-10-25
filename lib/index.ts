import { Subject, Subscribable } from 'rxjs';
import { tap } from 'rxjs/operators';

export * from './done-subject';
export * from './worker-observable';

export const rxApplyFirst = <T, U>(param: T, funcs: (null | ((val: T) => U))[]) => {
  const func = funcs.find(_ => typeof (_) === 'function');
  if (func) {
    return func(param);
  }
  return null;
}

export const rxApplyFirst_ = <T, U>(...funcs: (null | ((val: T) => U))[]) => (val: T) => rxApplyFirst<T, U>(val, funcs);

export const rxIfDo = <T>(check: boolean | ((val: T) => boolean), then: (val: T) => void) =>
  tap<T>(val => (typeof check === 'function' ? check(val) : check) ? then(val) : {});

export const rxThrowIf = <T, R>(check: boolean | ((val: T) => boolean), ex: R | ((val: T) => R)) =>
  tap<T>(val => {
    if (typeof check === 'function' ? check(val) : check) {
      throw typeof ex === 'function' ? (ex as (val: T) => R)(val) : ex;
    }
  });

export const rxComplete = (...subjects: Subject<any>[]) => subjects.filter(ii => !!ii && !ii.isStopped).forEach(ii => ii.complete());

export const rxJust = <T>(subscribable: Subscribable<T>) => subscribable.subscribe();
export const rxJust_ = <T>(subscribable: Subscribable<T>) => () => rxJust(subscribable);

export const rxNext_ = <S extends Subject<T>, T>(...subjects: S[]) => (arg: T) => subjects.forEach(ii => ii.next(arg));

export const rxFalse = <S extends Subject<boolean>>(...subjects: S[]) => rxNext_<Subject<boolean>, boolean>(...subjects)(false);
export const rxFire = <S extends Subject<{}>>(...subjects: S[]) => subjects.forEach(ii => ii.next());
export const rxNull = (...subjects: Subject<any>[]) => rxNext_<Subject<any>, any>(...subjects)(null);
export const rxTrue = <S extends Subject<boolean>>(...subjects: S[]) => rxNext_<Subject<boolean>, boolean>(...subjects)(true);

export const rxFalse_ = <S extends Subject<boolean>>(...subjects: S[]) => () => rxFalse(...subjects);
export const rxFire_ = <S extends Subject<{}>>(...subjects: S[]) => () => rxFire(...subjects);
export const rxNull_ = (...subjects: Subject<any>[]) => () => rxNull(...subjects);
export const rxTrue_ = <S extends Subject<boolean>>(...subjects: S[]) => () => rxTrue(...subjects);
