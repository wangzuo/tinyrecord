import MigrationTasks from '../MigrationTasks';

test('parseName', () => {
  expect(MigrationTasks.parseName('CreatePosts')).toEqual({
    template: 'createTable',
    tableName: 'posts'
  });
  expect(MigrationTasks.parseName('AddTitleToPosts')).toEqual({
    template: 'migration',
    tableName: 'posts',
    action: 'add'
  });
  expect(MigrationTasks.parseName('RemoveTitleFromPosts')).toEqual({
    template: 'migration',
    tableName: 'posts',
    action: 'remove'
  });
});

test('createTable', () => {
  expect(
    MigrationTasks.createTable(
      'CreatePosts',
      [{ name: 'title', type: 'string' }],
      { tableName: 'posts' }
    )
  ).toMatchSnapshot();
});

test('migration', () => {
  expect(
    MigrationTasks.migration(
      'AddTitleToPosts',
      [{ name: 'title', type: 'string' }],
      { action: 'add', tableName: 'posts' }
    )
  ).toMatchSnapshot();

  expect(
    MigrationTasks.migration(
      'RemoteTitleFromPosts',
      [{ name: 'title', type: 'string' }],
      {
        action: 'remove',
        tableName: 'posts'
      }
    )
  ).toMatchSnapshot();
});
