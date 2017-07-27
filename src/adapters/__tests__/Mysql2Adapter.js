import Mysql2Adapter from '../Mysql2Adapter';

const adapter = new Mysql2Adapter();

describe('Mysql2Adapter', () => {
  it('dataSourceSql', () => {
    expect(adapter.dataSourceSql('users')).toBe(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = database() AND table_name = 'users'`
    );
    expect(adapter.dataSourceSql(null, { type: 'BASE TABLE' })).toBe(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = database() AND table_type = 'BASE TABLE'`
    );
  });
});
