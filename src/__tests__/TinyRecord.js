import TinyRecord from '../TinyRecord';

test('it works', async () => {
  const User = TinyRecord.createClass({
    tableName: 'users'
  });

  TinyRecord.Base.establishConnection();

  // const user = await User.new();

  // await User.connection.createTable('users', { force: true }, t => {
  //   t.string('name', 'email');
  // });

  console.log(await User.connection.tables());

  // const user = await User.create({ name: 'test', email: 'test@example.com' });

  // await User.connection.addColumn('users', 'bio', 'string');
  // await User.connection.removeColumn('users', 'bio');
  // await User.connection.addTimestamps('users');
});
