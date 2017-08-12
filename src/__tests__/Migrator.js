import path from 'path';
import Migrator from '../Migrator';

test('loadMigrations', async () => {
  const migrations = await Migrator.loadMigrations([
    path.join(__dirname, './migrate')
  ]);

  expect(migrations).toMatchSnapshot();
});
