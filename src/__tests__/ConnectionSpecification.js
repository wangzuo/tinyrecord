import { ConnectionUrlResolver, Resolver } from '../ConnectionSpecification';

test('url resolver', () => {
  const url =
    'postgresql://foo:bar@localhost:9000/foo_test?pool=5&timeout=3000';

  expect(new ConnectionUrlResolver(url).toJSON()).toEqual({
    adapter: 'postgresql',
    host: 'localhost',
    port: 9000,
    database: 'foo_test',
    username: 'foo',
    password: 'bar',
    pool: '5',
    timeout: '3000'
  });
});

test('resolver', () => {
  const configurations = {
    production: {
      host: 'localhost',
      database: 'foo',
      adapter: 'sqlite3'
    }
  };

  expect(new Resolver(configurations).resolve('production')).toEqual({
    name: 'production',
    host: 'localhost',
    database: 'foo',
    adapter: 'sqlite3'
  });
});
