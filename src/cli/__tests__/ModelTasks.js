import ModelTasks from '../ModelTasks';

test('createModel', () => {
  expect(ModelTasks.createModel('user')).toMatchSnapshot();
});

test('createIndex', () => {
  expect(
    ModelTasks.createIndex(['User.js', 'Post.js', 'index.js'])
  ).toMatchSnapshot();
});
