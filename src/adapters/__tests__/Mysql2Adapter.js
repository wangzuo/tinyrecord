import TinyRecord from '../../TinyRecord';
import Mysql2Adapter from '../Mysql2Adapter';

const User = TinyRecord.createClass({
  tableName: 'users'
});

beforeAll(() => {
  TinyRecord.Base.establishConnection({
    adapter: 'mysql2',
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'tinyrecord'
  });

  return TinyRecord.Base.connection.createTable('users', { force: true }, t => {
    t.string('name', 'email');
    t.timestamps();
  });
});

afterAll(() => User.connection.disconnect());

test('tables', async () => {
  const tables = await TinyRecord.Base.connection.tables();
  expect(tables).toEqual(['users']);
});
