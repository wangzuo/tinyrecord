import Base from '../../Base';
import { testAdapter } from './AbstractAdapter';
import Mysql2Adapter from '../Mysql2Adapter';

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

afterAll(() => Base.connection.disconnect());

test('ADAPTER_NAME', () => {
  expect(Mysql2Adapter.ADAPTER_NAME).toBe('Mysql2');
});

testAdapter(Base);
