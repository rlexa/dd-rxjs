## 1.3.6

- _update_ **dependencies:** updated all dependencies and code conventions

## 1.3.5

- _update_ **dependencies:** updated all dependencies and code conventions
- _add_ **RxCleanup:** now also checks for `complete()` functions and calls them

## 1.3.1

- _change_ **target:** from `es5` to `ES2015`

## 1.3.0

- _change_ **rxFire:** expects `Subject<unknown>` args
- _update_ **all:** dependencies
- _dependency_ **prettier:** added

## 1.2.0

- _new_ **rxThrounceTime:** added pipe operator for start-throttle-end stream values

### 1.1.9

- _change_ **warn:** RxCleanup doesn't warn anymore about invalid targets (allowing for e.g. `null` Subscriptions), but instead when an exception is thrown while cleaning up

### 1.1.8

- _fix_ **bug:** RxCleanup now checks for an `unsubscribe()` object context to not be `null`

### 1.1.7

- _change_ **build:** RxCleanup cleanup function now has to be `ngOnDestroy` due to static type checking
- _tryfix_ **build:** RxCleanup now should correctly work in Angular production mode

### 1.1.6

- _fix_ **build:** RxCleanup now correctly supports derived types

### 1.1.5

- _fix_ **build:** RxCleanup now accepts private keys

### 1.1.4

- _fix_ **build:** RxCleanup now only cleans up instance's own keys

### 1.1.3

- _change_ **build:** building now as commonjs module instead of ES2015 (tryfix for failing peer tests)

### 1.1.2

- _change_ **RxCleanup:** added RxCleanupGlobal for pre-setting the cleanup function globally (and some settings)

## 1.1.1

- _new_ **RxCleanup:** added decorator function for cleaning up reactive properties in class contexts

### 1.0.2

- _chore_ **tests:** now correctly configured ts-jest and tsconfig
- _chore_ **lint:** added ts-lint and adjusted rules

### 1.0.1

- _chore_ **clean npm dist:** npm package should not contain any junk

# **1.0.0**

### Init

- **version 1.0.0:** code, tests
