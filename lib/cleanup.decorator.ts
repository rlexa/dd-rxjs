import { Subject } from 'rxjs';
import { DoneSubject } from './done-subject';

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
  return function(target: any, key: string) {
    const keyStorage = 'RxCleanupKeys';
    if (!(keyStorage in target) || !Array.isArray(target[keyStorage])) {
      target[keyStorage] = <string[]>[];

      const onDestroyOld: () => void = target[RxCleanupGlobal.funcCleanUp];
      target[RxCleanupGlobal.funcCleanUp] = function() {
        if (RxCleanupGlobal.logOnCleanup) {
          console.log(`RxCleanup: cleaning...`, this);
        }
        if (onDestroyOld) {
          onDestroyOld.apply(this);
        }

        this[keyStorage].forEach((_: string) => {
          const val = this[_];
          if (val instanceof DoneSubject) {
            if (RxCleanupGlobal.logOnCleanup) {
              console.log(`RxCleanup: ... ${_}: DoneSubject`);
            }
            val.done();
          } else if (val instanceof Subject) {
            if (RxCleanupGlobal.logOnCleanup) {
              console.log(`RxCleanup: ... ${_}: Subject`);
            }
            if (!val.isStopped) {
              val.complete();
            }
          } else if (typeof val === 'object' && typeof val.unsubscribe === 'function') {
            if (RxCleanupGlobal.logOnCleanup) {
              console.log(`RxCleanup: ... ${_}: SubscriptionLike`);
            }
            val.unsubscribe();
          } else if (RxCleanupGlobal.logWarnOnInvalidCleanupTarget) {
            console.warn(`RxCleanup: invalid target '${_}' on...`, this);
          }
        });

        if (RxCleanupGlobal.logOnCleanup) {
          console.log(`RxCleanup: done cleaning...`, this);
        }
      }
    }

    if (!!key && !target[keyStorage].includes(key)) {
      target[keyStorage].push(key);
    }
  };
}
