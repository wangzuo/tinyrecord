import ModelTasks from '../ModelTasks';

test('createModel', () => {
  expect(ModelTasks.createModel('user')).toMatchSnapshot();
});
