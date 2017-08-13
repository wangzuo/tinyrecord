import _ from 'lodash';

export default class TableMetadata {
  constructor(klass, arelTable, association = null) {
    this.klass = klass;
    this.arelTable = arelTable;
    this.association = association;

    // delegation
    if (this.association) {
      this.associationForeignType = this.association.foreignType;
      this.associationForeignKey = this.association.foreignKey;
      this.associationPrimaryKey = this.association.associationPrimaryKey;
    }
  }

  resolveColumnAliases(hash) {
    const newHash = _.clone(hash);
    _.forEach(hash, (_, key) => {
      if (_.isString(key) && this.klass.attributeAlias(key)) {
        newHash[this.klass.attributeAlias(key)] = newHash[key];
        delete newHash[key];
      }
    });
    return newHash;
  }

  arelAttribute(columnName) {
    if (this.klass) {
      return this.klass.arelAttribute(columnName, this.arelTable);
    }
    return this.arelTable.columnName(columnName);
  }

  async type(columnName) {
    if (this.klass) {
      return await this.klass.typeForAttribute(columnName); // promise
    }
    // todo
    return Type.defaultValue;
  }

  hasColumn(columnName) {
    return this.klass && this.klass.columnsHash[columnName];
  }

  associatedWith(associationName) {
    return this.klass && this.klass._reflectOnAssociation(associationName);
  }

  associatedTable(tableName) {}

  polymorphicAssociation() {
    return assocation && assocation.polymorphic;
  }
}
