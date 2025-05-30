import {jsonEqual} from './rx-util';
import {StateSubject} from './state-subject';

describe(`StateSubject`, () => {
  it(`provides constructed value`, () => expect(new StateSubject(123).value).toBe(123));

  it(`changes value only if incoming value is not same`, () => {
    const vals: unknown[] = [];
    const init = {a: 12};
    const sbj = new StateSubject(init);
    sbj.subscribe((ii) => vals.push(ii));
    sbj.next(init);
    sbj.next({a: 12});
    sbj.next({a: 13});
    sbj.complete();
    expect(vals).toEqual([{a: 12}, {a: 12}, {a: 13}]);
  });

  it(`changes value only if incoming value is not json equal`, () => {
    const vals: unknown[] = [];
    const init = {a: 12};
    const sbj = new StateSubject(init, {equal: jsonEqual});
    sbj.subscribe((ii) => vals.push(ii));
    sbj.next(init);
    sbj.next({a: 12});
    sbj.next({a: 13});
    sbj.complete();
    expect(vals).toEqual([{a: 12}, {a: 13}]);
  });
});
