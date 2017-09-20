import Boolean from '../Boolean';

// TODO
test('cast', () => {
  const type = new Boolean();

  expect(type.cast('')).toBeNull();
  // expect(type.cast(null)).toBeNull();

  expect(type.cast(true)).toBe(true);
  expect(type.cast(1)).toBe(true);
  expect(type.cast('1')).toBe(true);
  expect(type.cast('t')).toBe(true);
  expect(type.cast('T')).toBe(true);
  expect(type.cast('true')).toBe(true);
  expect(type.cast('TRUE')).toBe(true);
  expect(type.cast('on')).toBe(true);
  expect(type.cast('ON')).toBe(true);
  expect(type.cast(' ')).toBe(true);
  // expect(type.cast('\u3000\r\n')).toBe(true);
  // expect(type.cast('\u0000')).toBe(true);
  expect(type.cast('SOMETHING RANDOM')).toBe(true);

  expect(type.cast(false)).toBe(false);
  expect(type.cast(0)).toBe(false);
  expect(type.cast('0')).toBe(false);
  expect(type.cast('f')).toBe(false);
  expect(type.cast('F')).toBe(false);
  expect(type.cast('false')).toBe(false);
  expect(type.cast('FALSE')).toBe(false);
  expect(type.cast('off')).toBe(false);
  expect(type.cast('OFF')).toBe(false);
});
