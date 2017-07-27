export default class ForeignKeyDefinition {
  constructor(fromTable, toTable, options) {
    this.fromTable = fromTable;
    this.toTable = toTable;
    this.options = options;
  }
}
