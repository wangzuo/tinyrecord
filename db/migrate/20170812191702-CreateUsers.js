import Migration from '../../Migration';

class CreateUsers extends Migration {
  async change() {
    await this.createTable('posts', t => {
      t.string('title');
      t.timestamps();
    });
  }
}
