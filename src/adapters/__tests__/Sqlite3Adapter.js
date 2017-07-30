import TinyRecord from '../../TinyRecord';
import Sqlite3Adapter from '../Sqlite3Adapter';

const User = TinyRecord.createClass({
  tableName: 'users'
});

beforeAll(() => {
  TinyRecord.Base.establishConnection();

  return TinyRecord.Base.connection.createTable('users', { force: true }, t => {
    t.string('name', 'email');
    t.timestamps();
  });
});

describe('Sqlite3Adapter', () => {
  it('#loadSchema', async () => {
    await User.loadSchema();
  });

  it('#columns', async () => {
    const columns = await TinyRecord.Base.connection.columns('users');
    expect(columns).toMatchSnapshot();
  });

  it('#tables', async () => {
    const tables = await TinyRecord.Base.connection.tables();
    expect(tables).toEqual(['users']);
  });

  it('#views', async () => {
    const views = await TinyRecord.Base.connection.views();
    expect(views).toEqual([]);
  });

  it('#tableExists', async () => {
    expect(await TinyRecord.Base.connection.tableExists('users')).toBe(true);
    expect(await TinyRecord.Base.connection.tableExists('people')).toBe(false);
  });

  it('#create', async () => {
    const user = await User.create({ name: 'test', email: 'test@example.com' });

    console.log(user);
  });
});
