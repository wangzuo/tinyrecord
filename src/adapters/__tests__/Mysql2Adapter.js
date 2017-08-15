import Base from '../../Base';
import Mysql2Adapter from '../Mysql2Adapter';

class User extends Base {
  static tableName = 'users';
}

beforeAll(() => {
  Base.establishConnection({
    adapter: 'mysql2',
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'tinyrecord'
  });

  return Base.connection.createTable('users', { force: true }, t => {
    t.string('name', 'email');
    t.timestamps();
  });
});

afterAll(() => User.connection.disconnect());

test('tables', async () => {
  const tables = await Base.connection.tables();
  expect(tables).toEqual(['users']);
});

test('columns', async () => {
  const columns = await Base.connection.columns('users');
  expect(columns).toMatchSnapshot();
});

test('create', async () => {
  expect(User.recordTimestamps).toBe(true);

  const user = await User.create({ name: 'test', email: 'test@example.com' });

  expect(user.id).not.toBeNull();
  expect(user.name).toBe('test');
  expect(user.email).toBe('test@example.com');

  expect(user.createdAt).not.toBeNull();
  expect(user.updatedAt).not.toBeNull();
});

test('find', async () => {
  const user = await User.create({ name: 'test', email: 'test@example.com' });
  const data = await User.find(user.id);

  expect(data.id).toBe(user.id);
  expect(data.name).toBe(user.name);
  expect(data.email).toBe(user.email);
  expect(data.createdAt).not.toBeNull();
  expect(data.updatedAt).not.toBeNull();
});
