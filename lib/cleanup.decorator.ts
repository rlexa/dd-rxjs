import { Subject } from 'rxjs';
import { DoneSubject } from './done-subject';

/** Decorator for `Subject`, `DoneSubject`, `SubscriptionLike` types to be completed/unsubscribed on clean-up (optionally takes clean-up function name, default `ngOnDestroy`). */
export function RxCleanup(funcCleanUp = 'ngOnDestroy') {
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
        } else {
          console.warn(`RxCleanup: invalid target '${_}' on...`, instance);
        }
      });

      const onDestroyOld: () => void = target[funcCleanUp];
      target[funcCleanUp] = function() {
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
