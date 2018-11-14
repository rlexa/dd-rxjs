### 1.1.9

* *change* **warn:** RxCleanup doesn't warn anymore about invalid targets (allowing for e.g. `null` Subscriptions), but instead when an exception is thrown while cleaning up

### 1.1.8

* *fix* **bug:** RxCleanup now checks for an `unsubscribe()` object context to not be `null`

### 1.1.7

* *change* **build:** RxCleanup cleanup function now has to be `ngOnDestroy` due to static type checking
* *tryfix* **build:** RxCleanup now should correctly work in Angular production mode

### 1.1.6

* *fix* **build:** RxCleanup now correctly supports derived types

### 1.1.5

* *fix* **build:** RxCleanup now accepts private keys

### 1.1.4

* *fix* **build:** RxCleanup now only cleans up instance's own keys

### 1.1.3

* *change* **build:** building now as commonjs module instead of ES2015 (tryfix for failing peer tests)

### 1.1.2

* *change* **RxCleanup:** added RxCleanupGlobal for pre-setting the cleanup function globally (and some settings)

## 1.1.1

* *new* **RxCleanup:** added decorator function for cleaning up reactive properties in class contexts

### 1.0.2

* *chore* **tests:** now correctly configured ts-jest and tsconfig
* *chore* **lint:** added ts-lint and adjusted rules

### 1.0.1

* *chore* **clean npm dist:** npm package should not contain any junk

# **1.0.0**

### Init

* **version 1.0.0:** code, tests
