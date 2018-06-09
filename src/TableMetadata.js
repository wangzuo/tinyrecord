// @flow
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

  arelAttribute(columnName: string) {
    if (this.klass) {
      return this.klass.arelAttribute(columnName, this.arelTable);
    }
    return this.arelTable.columnName(columnName);
  }

  type(columnName: string) {
    return () => {
      if (this.klass) {
        return this.klass.typeForAttribute(columnName);
      }
      // todo
      return Type.defaultValue;
    };
  }

  hasColumn(columnName: string) {
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
