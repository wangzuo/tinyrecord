import Migration from '../../src/Migration';

export default class CreateUsers extends Migration {
  async change() {
    await this.createTable('users', t => {
      t.string('name');
      t.timestamps();
    });
  }
}
