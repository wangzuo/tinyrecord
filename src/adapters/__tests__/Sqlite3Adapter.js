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
    t.string('name', { default: 'untitled' });
    t.string('email');
    t.integer('age', { default: 0 });
    t.timestamps();
  });
});

test('ADAPTER_NAME', () => {
  expect(Sqlite3Adapter.ADAPTER_NAME).toBe('SQLite');
});

test('logger', () => {
  expect(User.connection.logger).not.toBeNull();
});

test('loadSchema', async () => {
  await User.loadSchema();
});

// todo: test views
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
    'age',
    'created_at',
    'updated_at'
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

test('records', async () => {
  expect(await User.all.records()).toMatchSnapshot();
  await User.create({ name: 'test', email: 'test@example.com' });
  expect(await User.all.records()).toMatchSnapshot();
});

// test('having', async () => {});

testAdapter(Base);
