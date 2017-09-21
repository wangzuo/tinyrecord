import Base from '../../Base';
import { testAdapter, createTables } from './AbstractAdapter';
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

  await createTables(Base.connection);
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

// todo: sqlite3 fix
describe('date type', () => {
  const moment = require('moment');

  it('handles string', async () => {
    const user = await User.new({ birthday: '2012-01-18' });
    expect(user.birthday.toDateString()).toBe('Wed Jan 18 2012');

    await user.save();
    expect(user.birthday.toDateString()).toBe('Wed Jan 18 2012');
    const record = await User.find(user.id);
    expect(record.birthday.toDateString()).toBe('Wed Jan 18 2012');
  });

  it('handles integer', async () => {
    const user = await User.new({ birthday: 1504454400007 });
    expect(user.birthday.toDateString()).toBe('Mon Sep 04 2017');
  });

  it('handles Date', async () => {
    const user = await User.new({ birthday: moment('2012-01-18').toDate() });
    expect(user.birthday.toDateString()).toBe('Wed Jan 18 2012');
  });

  // TODO
  // it('handles null', async () => {
  //   const user = await User.new({ birthday: null });
  //   expect(user.birthday).toBeNull();
  // });
});

testAdapter(Base);
