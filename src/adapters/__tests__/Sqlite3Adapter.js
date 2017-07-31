import TinyRecord from '../../TinyRecord';
import Sqlite3Adapter from '../Sqlite3Adapter';

const User = TinyRecord.createClass({
  tableName: 'users'
});

beforeAll(() => {
  TinyRecord.Base.establishConnection();

  return TinyRecord.Base.connection.createTable('users', { force: true }, t => {
    t.string('name', 'email');
    t.timestamps();
  });
});

test('#loadSchema', async () => {
  await User.loadSchema();
});

test('#columns', async () => {
  const columns = await TinyRecord.Base.connection.columns('users');
  expect(columns).toMatchSnapshot();
});

test('#tables', async () => {
  const tables = await TinyRecord.Base.connection.tables();
  expect(tables).toEqual(['users']);
});

test('#views', async () => {
  const views = await TinyRecord.Base.connection.views();
  expect(views).toEqual([]);
});

test('#tableExists', async () => {
  expect(await TinyRecord.Base.connection.tableExists('users')).toBe(true);
  expect(await TinyRecord.Base.connection.tableExists('people')).toBe(false);
});

test('#attributeNames', async () => {
  expect(await User.attributeNames()).toEqual([
    'id',
    'name',
    'email',
    'created_at',
    'updated_at'
  ]);
});

test('#attributeTypes', async () => {
  expect(await User.attributeTypes()).toMatchSnapshot();
});

test('#lookupCastType', () => {
  expect(User.connection.lookupCastType('INTEGER')).toMatchSnapshot();
});

test('#tableStructure', async () => {
  expect(await User.connection.tableStructure('users')).toMatchSnapshot();
});

test('#new', async () => {
  const user = await User.new({ name: 'test', email: 'test@example.com' });
  expect(user.attributes.attributes).toMatchSnapshot();
  expect(user.attributes).toMatchSnapshot();
});

test('#create', async () => {
  const user = await User.create({ name: 'test', email: 'test@example.com' });

  expect(user.id).toBe(1);
  // expect(user.name).toBe('test');
  // expect(user.email).toBe('email');
});
