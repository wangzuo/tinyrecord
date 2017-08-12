import path from 'path';
import Base from '../Base';
import Migrator from '../Migrator';
import SchemaMigration from '../SchemaMigration';

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

  const m1 = migrations[0].migration;
  const m2 = migrations[1].migration;

  expect(migrations.length).toBe(2);

  expect(m1.name).toBe('CreatePosts');
  expect(m1.version).toBe('20170812120950');

  expect(m2.name).toBe('CreateUsers');
  expect(m2.version).toBe('20170812191702');
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
  await SchemaMigration.dropTable();
  await Migrator.migrate([path.join(__dirname, '../../db/migrate')]);

  const tables = await Base.connection.tables();
  expect(tables).toEqual(['schema_migrations', 'posts', 'users']);
});
