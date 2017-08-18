import Base from '../../Base';
import { testAdapter } from './AbstractAdapter';
import Sqlite3Adapter from '../Sqlite3Adapter';

class User extends Base {
  static tableName = 'users';
}

beforeAll(() => {
  Base.establishConnection({
    adapter: 'sqlite3',
    database: ':memory:'
  });

  return Base.connection.createTable('users', { force: true }, t => {
    t.string('name', 'email');
    t.timestamps();
  });
});

test('ADAPTER_NAME', () => {
  expect(Sqlite3Adapter.ADAPTER_NAME).toBe('SQLite');
});

test('logger', () => {
  expect(User.connection.logger).not.toBeNull();
});

test('tableMetadata', async () => {
  expect(await User.tableMetadata.type('name')).toMatchSnapshot();
  expect(await User.tableMetadata.type('email')).toMatchSnapshot();
});

test('loadSchema', async () => {
  await User.loadSchema();
});

test('views', async () => {
  const views = await Base.connection.views();
  expect(views).toEqual([]);
});

test('tableExists', async () => {
  expect(await Base.connection.tableExists('users')).toBe(true);
  expect(await Base.connection.tableExists('people')).toBe(false);
});

test('attributeNames', async () => {
  expect(await User.attributeNames()).toEqual([
    'id',
    'name',
    'email',
    'createdAt',
    'updatedAt'
  ]);
});

test('attributeTypes', async () => {
  expect(await User.attributeTypes()).toMatchSnapshot();
});

test('lookupCastType', () => {
  expect(User.connection.lookupCastType('INTEGER')).toMatchSnapshot();
});

test('tableStructure', async () => {
  expect(await User.connection.tableStructure('users')).toMatchSnapshot();
});

test('new', async () => {
  const user = await User.new({ name: 'test', email: 'test@example.com' });
  expect(user.attributes.attributes).toMatchSnapshot();
  expect(user.attributes).toMatchSnapshot();
});

test('records', async () => {
  expect(await User.all.records()).toMatchSnapshot();
  await User.create({ name: 'test', email: 'test@example.com' });
  expect(await User.all.records()).toMatchSnapshot();
});

test('update', async () => {
  const user = await User.create({ name: 'test', email: 'test@example.com' });
  await user.update({ name: 'test1', email: 'test1@example.com' });
  expect(user.name).toBe('test1');
  expect(user.email).toBe('test1@example.com');

  const data = await User.find(user.id);
  expect(data.name).toBe('test1');
  expect(data.email).toBe('test1@example.com');
});

test('where', async () => {
  expect(await User.all.toSql()).toBe(`SELECT "users".* FROM "users"`);

  expect(await User.where({ name: 'test' }).toSql()).toBe(
    `SELECT "users".* FROM "users" WHERE "users"."name" = 'test'`
  );

  expect(
    await User.where({ name: 'test' })
      .where({ email: 'test@example.com' })
      .toSql()
  ).toBe(
    `SELECT "users".* FROM "users" WHERE "users"."name" = 'test' AND "users"."email" = 'test@example.com'`
  );

  expect(
    await User.where({ name: 'test', email: 'test@example.com' }).toSql()
  ).toBe(
    `SELECT "users".* FROM "users" WHERE "users"."name" = 'test' AND "users"."email" = 'test@example.com'`
  );
});

test('limit', async () => {
  expect(await User.where({ name: 'test' }).limit(1).toSql()).toBe(
    `SELECT  "users".* FROM "users" WHERE "users"."name" = 'test' LIMIT 1`
  );
});

// TOOD
// test('order', async () => {
//   expect(await User.order('name').toSql()).toBe(
//     `SELECT "users".* FROM "users" ORDER BY name`
//   );
// });

testAdapter(Base);
