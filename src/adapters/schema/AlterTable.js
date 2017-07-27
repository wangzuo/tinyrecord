import ForeignKeyDefinition from './ForeignKeyDefinition';
import AddColumnDefinition from './AddColumnDefinition';

export default class AlterTable {
  constructor(td) {
    this.td = td;
    this.adds = [];
    this.foreignKeyAdds = [];
    this.foreignKeyDrops = [];
    this.name = this.td.name;
  }

  addForeignKey(toTable, options) {
    this.foreignKeyAdds.push(new ForeignKeyDefinition(name, toTable, options));
  }

  dropForeignKey(name) {
    this.foreignKeyDrops.push(name);
  }

  addColumn(name, type, options) {
    this.adds.push(
      new AddColumnDefinition(this.td.newColumnDefinition(name, type, options))
    );
  }
}
