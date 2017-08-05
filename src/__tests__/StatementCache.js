import TinyRecord from '../TinyRecord';
import StatementCache from '../StatementCache';

test('create', async () => {
  TinyRecord.Base.establishConnection();
  await TinyRecord.Base.connection.createTable('users', { force: true }, t => {
    t.string('name', 'email');
    t.timestamps();
  });

  const User = TinyRecord.createClass({
    tableName: 'users'
  });

  const cache = StatementCache.create(TinyRecord.Base.connection, params =>
    User.where({ name: 'test' })
  );

  await cache.execute([], User, User.connection);
});
