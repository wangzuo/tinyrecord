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

test('where', async () => {
  expect(await User.all.toSql()).toBe(`SELECT \`users\`.* FROM \`users\``);

  expect(await User.where({ name: 'test' }).toSql()).toBe(
    `SELECT \`users\`.* FROM \`users\` WHERE \`users\`.\`name\` = 'test'`
  );

  expect(
    await User.where({ name: 'test' })
      .where({ email: 'test@example.com' })
      .toSql()
  ).toBe(
    `SELECT \`users\`.* FROM \`users\` WHERE \`users\`.\`name\` = 'test' AND \`users\`.\`email\` = 'test@example.com'`
  );

  expect(
    await User.where({ name: 'test', email: 'test@example.com' }).toSql()
  ).toBe(
    `SELECT \`users\`.* FROM \`users\` WHERE \`users\`.\`name\` = 'test' AND \`users\`.\`email\` = 'test@example.com'`
  );
});

test('limit', async () => {
  expect(await User.where({ name: 'test' }).limit(1).toSql()).toBe(
    `SELECT  \`users\`.* FROM \`users\` WHERE \`users\`.\`name\` = 'test' LIMIT 1`
  );
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
