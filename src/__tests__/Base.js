import Base from '../Base';

Base.establishConnection({
  adapter: 'sqlite3',
  database: ':memory:'
});

class User extends Base {
  static tableName = 'users';
}

// todo: more sanitize methods
// todo: quote fix foo'bar
test('sanitizeSqlArray', () => {
  expect(User.sanitizeSqlArray(['name=? and group_id=?', 'foobar', 4])).toBe(
    "name='foobar' and group_id=4"
  );

  // expect(
  //   User.sanitizeSqlArray([
  //     'name=:name and group_id=:group_id',
  //     { name: 'foobar', group_id: 4 }
  //   ])
  // ).toBe("name='foobar' and group_id=4");

  // expect(
  //   User.sanitizeSqlArray(["name='%s' and group_id='%s'", 'foobar', 4])
  // ).toBe("name='foobar' and group_id='4'");
});

test('sanitizeSqlForConditions', () => {
  expect(
    User.sanitizeSqlForConditions(['name=? and group_id=?', 'foobar', 4])
  ).toBe("name='foobar' and group_id=4");

  // expect(
  //   User.sanitizeSqlForConditions([
  //     'name=:name and group_id=:group_id',
  //     {
  //       name: "foo'bar",
  //       group_id: 4
  //     }
  //   ])
  // ).toBe("name='foobar' and group_id='4'");

  // expect(
  //   User.sanitizeSqlForConditions(["name='%s' and group_id='%s'", "foo'bar", 4])
  // ).toBe("name='foobar' and group_id='4'");

  // expect(User.sanitizeSqlForConditions("name='foobar' and group_id='4'")).toBe(
  //   "name='foobar' and group_id='4'"
  // );
});
