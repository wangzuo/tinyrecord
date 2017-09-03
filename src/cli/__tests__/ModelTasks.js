import ModelTasks from '../ModelTasks';

test('modelName', () => {
  expect(ModelTasks.modelName('user')).toBe('User');
  expect(ModelTasks.modelName('User')).toBe('User');
  expect(ModelTasks.modelName('search_history')).toBe('SearchHistory');
  expect(ModelTasks.modelName('SearchHistory')).toBe('SearchHistory');
});

test('tableName', () => {
  expect(ModelTasks.tableName('user')).toBe('users');
  expect(ModelTasks.tableName('User')).toBe('users');
  expect(ModelTasks.tableName('search_history')).toBe('search_histories');
  expect(ModelTasks.tableName('SearchHistory')).toBe('search_histories');
});

test('createModel', () => {
  expect(ModelTasks.createModel('User')).toMatchSnapshot();
  expect(ModelTasks.createModel('SearchHistory')).toMatchSnapshot();
  expect(ModelTasks.createModel('search_history')).toBe(
    ModelTasks.createModel('SearchHistory')
  );
});

test('createIndex', () => {
  expect(
    ModelTasks.createIndex([
      'User.js',
      'Post.js',
      'SearchHistory.js',
      'index.js'
    ])
  ).toMatchSnapshot();
});
