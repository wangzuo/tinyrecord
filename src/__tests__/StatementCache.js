import Base from '../Base';
import StatementCache from '../StatementCache';

test('create', async () => {
  Base.establishConnection({
    adapter: 'sqlite3',
    database: ':memory:'
  });

  await Base.connection.createTable('users', { force: true }, t => {
    t.string('name', 'email');
    t.timestamps();
  });

  class User extends Base {
    static tableName = 'users';
  }

  const cache = StatementCache.create(Base.connection, params =>
    User.where({ name: 'test' })
  );

  await cache.execute([], User, User.connection);
});
