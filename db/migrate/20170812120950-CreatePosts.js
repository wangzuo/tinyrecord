import Migration from '../../src/Migration';

export default class CreatePosts extends Migration {
  async change() {
    await this.createTable('posts', {}, t => {
      t.string('title');
      t.timestamps();
    });
  }
}
