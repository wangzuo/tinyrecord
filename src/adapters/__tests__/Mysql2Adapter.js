import Base from '../../Base';
import { testAdapter } from './AbstractAdapter';
import Mysql2Adapter from '../Mysql2Adapter';

class User extends Base {
  static tableName = 'users';
}

beforeAll(async () => {
  Base.establishConnection({
    adapter: 'mysql2',
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'tinyrecord'
  });

  await Base.connection.createTable('users', { force: true }, t => {
    t.string('name', { default: 'untitled' });
    t.string('email');
    t.integer('age', { default: 0 });
    t.boolean('active', { default: true });
    t.timestamps();
  });

  await Base.connection.createTable('posts', { force: true }, t => {
    t.string('title');
    t.text('content');
    t.integer('user_id');
    t.timestamps();
  });
});

afterAll(() => Base.connection.disconnect());

test('ADAPTER_NAME', () => {
  expect(Mysql2Adapter.ADAPTER_NAME).toBe('Mysql2');
});

test('typeToSql binary types', () => {
  const adapter = User.connection;

  expect(adapter.typeToSql('binary', { limit: 64 })).toBe('varbinary(64)');
  expect(adapter.typeToSql('binary', { limit: 4095 })).toBe('varbinary(4095)');
  expect(adapter.typeToSql('binary', { limit: 4096 })).toBe('blob');
  expect(adapter.typeToSql('binary')).toBe('blob');
});

test('lookupCastType', () => {
  const adapter = User.connection;

  expect(adapter.lookupCastType('tinyint(1)')).toMatchSnapshot();
});

testAdapter(Base);
