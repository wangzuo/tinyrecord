// @flow
import TableDefinition from './TableDefinition';
import AddColumnDefinition from './AddColumnDefinition';
import ForeignKeyDefinition from './ForeignKeyDefinition';

export default class AlterTable {
  name: string;
  adds: Array<AddColumnDefinition>;
  foreignKeyAdds: Array<ForeignKeyDefinition>;
  foreignKeyDrops: Array<string>;
  td: TableDefinition;

  constructor(td: TableDefinition) {
    this.td = td;
    this.adds = [];
    this.foreignKeyAdds = [];
    this.foreignKeyDrops = [];
    this.name = this.td.name;
  }

  addForeignKey(toTable, options) {
    this.foreignKeyAdds.push(new ForeignKeyDefinition(name, toTable, options));
  }

  dropForeignKey(name: string) {
    this.foreignKeyDrops.push(name);
  }

  addColumn(name: string, type, options) {
    this.adds.push(
      new AddColumnDefinition(this.td.newColumnDefinition(name, type, options))
    );
  }
}
