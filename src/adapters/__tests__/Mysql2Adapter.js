import Base from '../../Base';
import { testAdapter } from './AbstractAdapter';
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

afterAll(() => Base.connection.disconnect());

test('ADAPTER_NAME', () => {
  expect(Mysql2Adapter.ADAPTER_NAME).toBe('Mysql2');
});

test('order', async () => {
  expect(await User.order('name').toSql()).toBe(
    'SELECT `users`.* FROM `users` ORDER BY `users`.`name` ASC'
  );

  expect(await User.order({ name: 'desc', email: 'asc' }).toSql()).toBe(
    'SELECT `users`.* FROM `users` ORDER BY `users`.`name` DESC, `users`.`email` ASC'
  );

  expect(await User.orderBy('name').toSql()).toBe(
    'SELECT `users`.* FROM `users` ORDER BY name'
  );
});

testAdapter(Base);
