import AbstractAdapter from '../AbstractAdapter';

test('ADAPTER_NAME', () => {
  expect(AbstractAdapter.ADAPTER_NAME).toBe('Abstract');
});

export function testAdapter(Base) {
  class User extends Base {
    static tableName = 'users';
  }

  test('tables', async () => {
    const tables = await Base.connection.tables();
    expect(tables).toEqual(['users']);
  });

  test('columns', async () => {
    const columns = await Base.connection.columns('users');
    expect(columns).toMatchSnapshot();
  });

  test('new', async () => {
    const user = await User.new({ name: 'test', email: 'test@example.com' });
    expect(user.attributes.attributes).toMatchSnapshot();
    expect(user.attributes).toMatchSnapshot();
  });

  test('create', async () => {
    expect(User.recordTimestamps).toBe(true);

    const user = await User.create({ name: 'test', email: 'test@example.com' });

    expect(user.id).not.toBeNull();
    expect(user.name).toBe('test');
    expect(user.email).toBe('test@example.com');

    expect(user.createdAt).not.toBeNull();
    expect(user.updatedAt).not.toBeNull();
  });

  test('find', async () => {
    const user = await User.create({ name: 'test', email: 'test@example.com' });
    const data = await User.find(user.id);

    expect(data.id).toBe(user.id);
    expect(data.name).toBe(user.name);
    expect(data.email).toBe(user.email);
    expect(data.createdAt).not.toBeNull();
    expect(data.updatedAt).not.toBeNull();
  });

  test('findBy', async () => {
    const user = await User.create({
      name: 'findBy',
      email: 'findBy@example.com'
    });
    const data = await User.findBy({
      name: 'findBy',
      email: 'findBy@example.com'
    });

    expect(data.id).toBe(user.id);
    expect(data.name).toBe(user.name);
    expect(data.email).toBe(user.email);
    expect(data.createdAt).not.toBeNull();
    expect(data.updatedAt).not.toBeNull();
  });

  test('update', async () => {
    const user = await User.create({ name: 'test', email: 'test@example.com' });
    await user.update({ name: 'test1', email: 'test1@example.com' });
    expect(user.name).toBe('test1');
    expect(user.email).toBe('test1@example.com');

    const data = await User.find(user.id);
    expect(data.name).toBe('test1');
    expect(data.email).toBe('test1@example.com');
  });
}
