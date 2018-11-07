import { Subject } from 'rxjs';
import { DoneSubject } from './done-subject';

const RX_CLEANUP_TARGETED = 'RxCleanupTargeted';
const RX_CLEANUP_CACHE_PROTOTYPES = new Array<{ proto: any, keys: string[] }>();

function cleanUp(instance: any, prototype: any) {
  if (!prototype || prototype === Object.prototype) {
    return;
  }

  const cached = RX_CLEANUP_CACHE_PROTOTYPES.find(_ => _.proto === prototype);
  (cached ? cached.keys : []).forEach((key: string) => {
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
    } else if (typeof val === 'object' && typeof val.unsubscribe === 'function') {
      if (RxCleanupGlobal.logOnCleanup) {
        console.log(`RxCleanup: ... ${key}: SubscriptionLike`);
      }
      val.unsubscribe();
    } else if (RxCleanupGlobal.logWarnOnInvalidCleanupTarget) {
      console.warn(`RxCleanup: invalid target '${key}' on...`, instance);
    }
  });

  cleanUp(instance, Object.getPrototypeOf(prototype));
}

export const RxCleanupGlobal = {
  /** set the function which will be called for cleaning up (will replace with a hook) */
  funcCleanUp: 'ngOnDestroy',
  logOnCleanup: false,
  logWarnOnInvalidCleanupTarget: true,
}

/**
 *  Decorator for `Subject`, `DoneSubject`, `SubscriptionLike` types to be completed/unsubscribed on clean-up.
 *  Set cleanUp function in `RxCleanupGlobal.funcCleanUp` (default is Angular's `ngOnDestroy`).
 */
export function RxCleanup() {
  return function(prototype: any, field: string) {
    let found = RX_CLEANUP_CACHE_PROTOTYPES.find(_ => _.proto === prototype);
    if (!found) {
      RX_CLEANUP_CACHE_PROTOTYPES.push(found = { proto: prototype, keys: [] });
      if (!prototype[RX_CLEANUP_TARGETED]) {
        const onDestroyOld: () => void = prototype[RxCleanupGlobal.funcCleanUp];
        prototype[RxCleanupGlobal.funcCleanUp] = function() {
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
        }
        prototype[RX_CLEANUP_TARGETED] = true;
      }
    }

    if (!!field && !found.keys.includes(field)) {
      found.keys.push(field);
    }
  };
}
