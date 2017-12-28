import FromClause from '../FromClause';

test('empty', () => {
  const fromClause = new FromClause('posts');
  expect(fromClause.empty()).toBe(false);
});
