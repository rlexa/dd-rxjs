import { rxApplyFirst, rxApplyFirst_ } from '.';

describe('rxjs extension', () => {
  test('rxApplyFirst', () => {
    expect(rxApplyFirst(1, [])).toBe(null);
    expect(rxApplyFirst(1, [_ => _])).toBe(1);
    expect(rxApplyFirst(1, [_ => _ + 1, _ => _])).toBe(2);
    expect(rxApplyFirst(1, [null, _ => _])).toBe(1);
  });

  test('rxApplyFirst_', () => {
    expect(rxApplyFirst_()(1)).toBe(null);
    expect(rxApplyFirst_(_ => _)(1)).toBe(1);
    expect(rxApplyFirst_((_: number) => _ + 1, _ => _)(1)).toBe(2);
    expect(rxApplyFirst_(null, _ => _)(1)).toBe(1);
  });
});
