import {Subject} from 'rxjs';
import {DoneSubject} from './done-subject';

const RX_CLEANUP_TARGETED = 'RxCleanupTargeted';
const RX_CLEANUP_CACHE_PROTOTYPES = new Array<{proto: any; keys: string[]}>();

function cleanUp(instance: any, prototype: any) {
  if (!prototype || prototype === Object.prototype) {
    return;
  }

  const cached = RX_CLEANUP_CACHE_PROTOTYPES.find(_ => _.proto === prototype);
  (cached ? cached.keys : []).forEach((key: string) => {
    try {
      const val = instance[key];
      if (val instanceof DoneSubject) {
        if (RxCleanupGlobal.logOnCleanup) {
          console.log(`RxCleanup: ... ${key}: DoneSubject`);
        }
        val.done();
      } else if (val instanceof Subject) {
        if (RxCleanupGlobal.logOnCleanup) {
          console.log(`RxCleanup: ... ${key}: Subject`);
        }
        if (!val.isStopped) {
          val.complete();
        }
      } else if (typeof val === 'object' && !!val && typeof val.unsubscribe === 'function') {
        if (RxCleanupGlobal.logOnCleanup) {
          console.log(`RxCleanup: ... ${key}: SubscriptionLike`);
        }
        val.unsubscribe();
      }
    } catch {
      if (RxCleanupGlobal.logWarnOnInvalidCleanupTarget) {
        console.warn(`RxCleanup: invalid target '${key}' on...`, instance);
      }
    }
  });

  cleanUp(instance, Object.getPrototypeOf(prototype));
}

export const RxCleanupFunction = 'ngOnDestroy';
export const RxCleanupGlobal = {
  logOnCleanup: false,
  logWarnOnInvalidCleanupTarget: true,
};

/**
 *  Decorator for `Subject`, `DoneSubject`, `SubscriptionLike` types to be completed/unsubscribed on clean-up.
 *  Target prototype has to implement Angular's `ngOnDestroy() { }` function (else won't work in production builds).
 */
export function RxCleanup() {
  return function<T extends {['ngOnDestroy']: () => void}>(prototype: T, field: string) {
    let found = RX_CLEANUP_CACHE_PROTOTYPES.find(_ => _.proto === prototype);
    if (!found) {
      RX_CLEANUP_CACHE_PROTOTYPES.push((found = {proto: prototype, keys: []}));
      if (!(prototype as any)[RX_CLEANUP_TARGETED]) {
        (prototype as any)[RX_CLEANUP_TARGETED] = true;

        const onDestroyOld: () => void = prototype[RxCleanupFunction];
        if (!onDestroyOld) {
          console.warn(
            `RxCleanup: missing cleanup function ${RxCleanupFunction}, cleanup may not work in production builds on...`,
            prototype,
          );
        }
        prototype[RxCleanupFunction] = function() {
          if (RxCleanupGlobal.logOnCleanup) {
            console.log(`RxCleanup: cleaning...`, this);
          }

          if (onDestroyOld) {
            onDestroyOld.apply(this);
          }

          cleanUp(this, Object.getPrototypeOf(this));

          if (RxCleanupGlobal.logOnCleanup) {
            console.log(`RxCleanup: done cleaning...`, this);
          }
        };
      }
    }

    if (!!field && !found.keys.includes(field)) {
      found.keys.push(field);
    }
  };
}
