import {jsonEqual, notNullUndefined} from './rx-util';

describe(`util`, () => {
  describe(`jsonEqual`, () => {
    test(`equals values`, () => expect(jsonEqual(1, 1)).toBe(true));
    test(`diffs values`, () => expect(jsonEqual(1, 2)).toBe(false));
    test(`equals objects`, () => expect(jsonEqual({a: 1}, {a: 1})).toBe(true));
    test(`diffs objects`, () => expect(jsonEqual({a: 1}, {a: 2})).toBe(false));
  });

  describe(`notNullUndefined`, () => {
    test(`checks null`, () => expect(notNullUndefined(null)).toBe(false));
    test(`checks undefined`, () => expect(notNullUndefined(undefined)).toBe(false));
    test(`checks non-null-undefined`, () => expect(notNullUndefined('')).toBe(true));
  });
});
