import { Observable } from 'rxjs';

export const work$ = <T, U>(func: (val: T) => U | Promise<U>, val: T) => new Observable<U>(
  subscriber => {
    let worker = <Worker | null>null;
    try {
      worker = new Worker(URL.createObjectURL(new Blob([`
        const func = ${func.toString()}
        self.onmessage = ev => {
          try {
            const got = func(ev.data);
            if (got instanceof Promise) {
              got.then(
                data => postMessage({data, error: null}),
                ex => postMessage({data: null, error: ex || 'error'}),
              );
            } else {
              postMessage({data: got, error: null});
            }
          } catch (ex) {
            postMessage({data: null, error: ex || 'error'});
          }
        }
      `], { type: 'application/javascript' })));
    } catch (ex) {
      subscriber.error(ex);
    }

    if (worker) {
      worker.onerror = subscriber.error;
      worker.onmessage = data => {
        if (data.data.error) {
          subscriber.error(data.data.error);
        } else {
          subscriber.next(data.data.data as U);
          subscriber.complete();
        }
      }
      worker.postMessage(val);
    }

    return () => {
      if (worker) {
        worker.terminate();
        worker = null;
      }
    }
  },
);

export const work$_ = <T, U>(func: (val: T) => U | Promise<U>) => (val: T) => work$(func, val);
