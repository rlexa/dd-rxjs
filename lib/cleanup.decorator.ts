import { Subject } from 'rxjs';
import { DoneSubject } from './done-subject';

export const RxCleanupGlobal = {
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
    if (!target.rxCleanupKeys) {
      target.rxCleanupKeys = [];

      const onCleanUp = (instance: any) => (target.rxCleanupKeys as string[]).forEach(_ => {
        const val = instance[_];
        if (val instanceof DoneSubject) {
          val.done();
        } else if (val instanceof Subject && !val.isStopped) {
          val.complete();
        } else if (typeof val === 'object' && typeof val.unsubscribe === 'function') {
          val.unsubscribe();
        } else if (RxCleanupGlobal.logWarnOnInvalidCleanupTarget) {
          console.warn(`RxCleanup: invalid target '${_}' on...`, instance);
        }
      });

      const onDestroyOld: () => void = target[RxCleanupGlobal.funcCleanUp];
      target[RxCleanupGlobal.funcCleanUp] = function() {
        if (RxCleanupGlobal.logOnCleanup) {
          console.log(`RxCleanup: cleaning up on...`, this);
        }
        if (onDestroyOld) {
          onDestroyOld.apply(this);
        }
        onCleanUp(this);
      };
    }
    if (!!key && !target.rxCleanupKeys.includes(key)) {
      target.rxCleanupKeys.push(key);
    }
  };
}
