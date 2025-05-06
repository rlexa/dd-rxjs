# dd-rxjs

Rxjs extensions.

## Info

Provides some handy extensions for rxjs library.

## Observables

### `DoneSubject` (deprecated, see `takeUntilDestroyed` in native Angular)

### `StateSubject`

Normal `BehaviorSubject` but only sets the value in `next` if it's not the same (identity check) as current `.value`...

```typescript
const sbj$ = new StateSubject(123);
sbj$.next(123); // ignored
sbj$.next(234); // accepted
```

...or if it satisfies inequality with optional equality function:

```typescript
const sbj$ = new StateSubject({a: 1}, {equal: jsonEqual});
sbj$.next({a: 1}); // ignored
sbj$.next({a: 2}); // accepted
```

### `work$` (`work$_` for curry)

Wrapper for web Worker: takes a function which gets evaluated with the provided value in a dedicated web worker context. The function is stringified i.e. it needs to be pure and can only use functions inside of it's own scope. The Worker is created, executed and terminated when subscribed.

```typescript
// e.g. creating some testing data with a delay

// worker$: (val: number) => Observable<string[]>
const worker$ = work$_(
  (data: number) => new Promise<string[]>((resolve) => setTimeout(
    () => resolve(
      Array.from(Array(data), (ii, _) => _.toString().padStart(16, '-'))
    ), 1000)));

const testCount$ = new Subject<number>();
const testData$ = testCount$.pipe(switchMap(this.worker$));
...
testData$.subscribe(console.log);
testCount$.next(1234);
```

## Decorator

### `RxCleanup`

Can be used in class contexts to clean up reactive properties. Completes `Subject`, unsubscribes `SubscriptionLike` and is compatible with `DoneSubject` i.e. calls `DoneSubject.done()` when encountered. The targeted prototypes have to implement and call the `destroy() {}` function even if it's empty otherwise (this ensures production build support).

#### `RxCleanupGlobal`

Invalid cleanup targets are logged by default - this can be deactivated by setting `RxCleanupGlobal.logWarnOnInvalidCleanupTarget = false` if it can be ignored. Silly log level on cleanup can be enabled by setting `RxCleanupGlobal.logOnCleanup = true`.

```typescript
export class ReactiveDataComponent<T> {
  @RxCleanup() readonly data$ = new BehaviorSubject(<T[]>[]); // auto-completed
  readonly total$ = this.data$.pipe(map((_) => _.length));
  destroy() {}
}
```

## Stable busy-or-error-or-body request streams.

The usual UI case is: based on parameter changes backend data needs to be re-requested - while waiting on the response it should be clear that we are busy and if the request has an error it should not auto-complete the stream (which is what happens in rxjs). The stable stream should be share-able so that there is a component showing the data, a component showing up in case there was an error and another widget indicating that loading is being done by looking at the busy flag.

The result is a stable shared stream where every value adheres to this interface:

```typescript
export interface WrapBusyErrorBody<T> {
  busy: boolean;
  error?: unknown;
  body?: T;
}
```

```typescript
// example for a stream where no query is needed

const triggerReload$ = new Subject<void>();

const userConfigStream$ = rxWrapStream({
  trigger$: triggerReload$,
  apiCall: () => apiService.getUserConfiguration(),
});
```

```typescript
// example for a stream where query is needed

const triggerReload$ = new Subject<void>();
const fromDate$ = new StateSubject<string | null>(null);
const toDate$ = new StateSubject<string | null>(null);

rxWrapQueriedStream({
  trigger$: triggerReload$,
  query$: combineLatest([fromDate$, toDate$]),
  apiCall: ([from, to]) => apiService.getItems({from, to}),
});
```

## Reactive Util

### `rxApplyFirst` (`rxApplyFirst_` for curry)

Applies first found non-null function to the provided value.

```typescript
dataStream$.subscribe(rxApplyFirst_(this.setRemoteData, rxNext_(this.cachedData$)));
```

### `rxComplete`

Completes (not yet completed) Subjects. Compatible with `DoneSubject` i.e. calls `DoneSubject.done()` when encountered.

```typescript
rxComplete(this.doneSubject$, this.behaviorSubject$, this.someSubject$);
```

### `rxFalse` (`rxFalse_` for curry)

Calls next(false) on Subjects. See also `rxTrue`.

```typescript
busy$ = new BehaviorSubject(false);

request = (id: string) => of(id)
  .pipe(
    tap(rxTrue_(busy$)),
    switchMap(val => api.requestData$(id)),
    finalize(rxFalse_(busy$)),
  .subscribe(rxNext_(data$));
```

### `rxFanOut` operator

Implemented as `shareReplay({refCount: true, bufferSize: 1})` i.e. first sub starts, others share, last unsub completes.

```typescript
const sharedStream$ = stream$.pipe(rxFanOut());
```

### `rxFire` (`rxFire_` for curry)

Calls next() on Subjects.

```typescript
reload = () => rxFire(triggerReload$);

merge(tableFilter$, tableSortColumn$, tableSortDirection$).pipe(debounceTime(0)).subscribe(rxFire_(triggerReload$, saveCurrentParameter$));
```

### `rxJust` (`rxJust_` for curry)

Subscribes to a `Subscribable`.

```typescript
logout$ = api.sendLogout$();
...
rxJust(logout$);
```

### `rxIfDo`

Can be used as operator: checks pipe value or function of value and executes code if true.

```typescript
eventCodeStream$
  .pipe(
    rxIfDo(
      (code) => code === CODE_FATAL,
      () => console.error('FATAL ERROR!'),
    ),
  )
  .subscribe();
```

### `rxIfThrow`

Can be used as operator: checks pipe value or function of value and throws exception if true.

```typescript
eventCodeStream$.pipe(rxIfThrow((code) => code === CODE_FATAL, new Error('FATAL ERROR!'))).subscribe();
```

### `rxNext` (`rxNext_` for curry)

Calls next(value) on Subjects.

```typescript
// e.g. setter wrapper
currentId$ = new BehaviorSubject(0);
setId = rxNext_(this.currentId$);
setId(1234);

// e.g. instead of: val => subject.next(val)
combineLatest(name$, password$)
  .pipe(map(([name, pwd]) => <UserData>{name, pwd}))
  .subscribe(rxNext_(userData$));
```

### `rxNull` (`rxNull_` for curry)

Calls next(null) on Subjects.

```typescript
triggerClear$.subscribe(rxNull_(filter$, data$, cache$));
```

### `rxTrue` (`rxTrue_` for curry)

Calls next(true) on Subjects. See also `rxFalse`.

```typescript
busy$ = new BehaviorSubject(false);

request = (id: string) => of(id)
  .pipe(
    tap(rxTrue_(busy$)),
    switchMap(val => api.requestData$(id)),
    finalize(rxFalse_(busy$)),
  .subscribe(rxNext_(data$));
```

### `rxThrounceTime`

Pipe operator which combines `throttleTime` and `debounceTime` to ensure stream's starting value, smooth throttling in between and the end value.

```typescript
interval(100).pipe(take(13), rxThrounceTime(500)).subscribe(console.log);
// 0 6 12
// (in test cases without browser may evaluate to 0 5 10 12)
```

## Util

### `jsonEqual`

Just checks JSON equality.

### `notNullUndefined`

Type guard checking type value not being `null` or `undefined`, useful when used in `stream$.pipe(filter(notNullUndefined))`.

## License

MIT

[source code]: https://github.com/rlexa/dd-rxjs
