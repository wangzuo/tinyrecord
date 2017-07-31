import TypeMap from '../TypeMap';
import Type from '../../Type';

test('default type', () => {
  const mapping = new TypeMap();
  expect(mapping.lookup('string')).toEqual(Type.defaultValue);
});

test('registerType', () => {
  const mapping = new TypeMap();

  const string = () => 'string';
  mapping.registerType(/varchar/i, null, string);

  expect(mapping.lookup('varchar')).toBe('string');
  expect(mapping.lookup('varchar')).toBe('string');
});

test('overriding registerType', () => {
  const mapping = new TypeMap();
  const time = () => 'time';
  const timestamp = () => 'timestamp';

  mapping.registerType(/time/i, null, time);
  mapping.registerType(/time/i, null, timestamp);

  expect(mapping.lookup('time')).toBe('timestamp');
});

test('fuzzy lookup', () => {
  const string = () => 'string';
  const mapping = new TypeMap();

  mapping.registerType(/varchar/i, null, string);
  expect(mapping.lookup('varchar(20)')).toBe('string');
});

test('aliasing types', () => {
  const string = () => 'string';
  const mapping = new TypeMap();

  mapping.registerType(/string/i, null, string);
  mapping.aliasType(/varchar/i, 'string');

  expect(mapping.lookup('varchar')).toBe('string');
});

// test('aliases keep metadata', () => {
//   const mapping = new TypeMap();
//   mapping.registerType(/decimal/i, sqlType => sqlType);
//   mapping.aliasType(/number/i, 'decimal');

//   expect(mapping.lookup('number(20)')()).toBe('decimal(20)');
//   expect(mapping.lookup('number')()).toBe('decimal');
// });

test('clear', () => {
  const mapping = new TypeMap();
  mapping.clear();
  // todo
});
