import path from 'path';
import Base from '../Base';
import Migrator from '../Migrator';
import SchemaMigration from '../SchemaMigration';

class Post extends Base {
  static tableName = 'posts';
}

class User extends Base {
  static tableName = 'users';
}

beforeAll(() => {
  Base.establishConnection({
    adapter: 'sqlite3',
    database: ':memory:'
  });
});

test('loadMigrations', async () => {
  const migrations = await Migrator.loadMigrations([
    path.join(__dirname, '../../db/migrate')
  ]);

  expect(migrations).toMatchSnapshot();
});

test('versions', async () => {
  expect(await Migrator.getAllVersions()).toEqual([]);
  expect(await Migrator.currentVersion()).toBe(0);
  await SchemaMigration.createTable();
  await SchemaMigration.create({ version: 2 });
  await SchemaMigration.create({ version: 1 });
  expect(await Migrator.getAllVersions()).toEqual([1, 2]);
  expect(await Migrator.currentVersion()).toBe(2);
});

test('migrate', async () => {
  await Migrator.migrate([path.join(__dirname, './migrate')]);
});
