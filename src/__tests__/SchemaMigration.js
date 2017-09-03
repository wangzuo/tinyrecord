import Base from '../Base';
import SchemaMigration from '../SchemaMigration';

beforeAll(() => {
  Base.establishConnection({
    adapter: 'sqlite3',
    database: ':memory:'
  });
});

test('SchemaMigration', () => {
  expect(SchemaMigration.primaryKey).toBe('version');
  expect(SchemaMigration.tableName).toBe('schema_migrations');
});

test('createTable', async () => {
  await SchemaMigration.createTable();
});

test('dropTable', async () => {
  await SchemaMigration.dropTable();
});

test('allVersions', async () => {
  await SchemaMigration.createTable();
  await SchemaMigration.create({ version: 2 });
  await SchemaMigration.create({ version: 1 });
  const versions = await SchemaMigration.allVersions();

  expect(versions).toEqual(['1', '2']);
});
