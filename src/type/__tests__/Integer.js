import Integer from '../Integer';

test('serialize', () => {
  const type = new Integer();

  expect(type.serialize(1)).toBe(1);
  expect(type.serialize(0)).toBe(0);
});
