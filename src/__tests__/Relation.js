import TinyRecord from '../TinyRecord';
import Relation from '../Relation';

class FakeClass {}
const Post = TinyRecord.createClass({ tableName: 'posts' });

test('initialize', () => {
  const relation = new Relation(FakeClass, 'table', null);

  expect(relation.klass).toBe(FakeClass);
  expect(relation.table).toBe('table');

  expect(relation.includesValues).toEqual([]);
  expect(relation.limitValue).toBeNull();
  expect(relation.whereClause).toEqual({ predicates: [], binds: [] });
  expect(relation.havingClause).toEqual({ predicates: [], binds: [] });
  expect(relation.fromClause).toEqual({ value: null, name: null });
  expect(relation.createWithValue).toEqual({});

  // expect(relation.extensions).toEqual([]);

  expect(relation.whereValuesJSON()).toEqual({});
  expect(relation.scopeForCreate).toEqual({});
});

test('createWithValue', () => {
  const relation = new Relation(Post, Post.arelTable, Post.predicateBuilder);
  const value = { hello: 'world' };
  relation.createWithValue = value;
  expect(relation.scopeForCreate).toEqual(value);
});

test('createWithValue with wheres', () => {
  const relation = new Relation(Post, Post.arelTable, Post.predicateBuilder);
  relation.where_(relation.table.column('id').eq(10));

  relation.createWithValue = { hello: 'world' };
  expect(relation.scopeForCreate).toEqual({ hello: 'world', id: 10 });
});

// test('eagerLoading', () => {
//   const relation = new Relation(FakeClass, 'table', null);
//   expect(relation.eagerLoading).toBe(false);
//   relation.eagerLoad_('b');
//   expect(relation.eagerLoading).toBe(true);
// });

test('referencesValues', () => {
  let relation = new Relation(FakeClass, 'b', null);
  expect(relation.referencesValues).toEqual([]);
  relation = relation.references('foo').references('omg', 'lol');
  expect(relation.referencesValues).toEqual(['foo', 'omg', 'lol']);
});

test('referencesValues dont duplicate', () => {
  let relation = new Relation(FakeClass, 'b', null);
  relation = relation.references('foo').references('foo');
  expect(relation.referencesValues).toEqual(['foo']);
});

test('relations can be created with a values hash', () => {
  const relation = new Relation(FakeClass, 'b', null, { select: ['foo'] });
  expect(relation.selectValues).toEqual(['foo']);
});
