// @flow
import _ from 'lodash';
import { plural } from 'pluralize';
import fs from 'fs';
import path from 'path';
import moment from 'moment';
import mkdirp from 'mkdirp';

export default class MigrationTasks {
  static create(name: string, attributes) {
    const options = this.parseName(name);
    const attrs = this.parseAttributes(attributes);
    const ts = moment().format('YYYYMMDDHHmmss');
    const filename = `${ts}-${name}.js`;

    const module = this[options.template](name, attrs, options);
    const migrateDir = path.join(process.cwd(), './db/migrate');
    const filepath = path.join(migrateDir, filename);

    mkdirp.sync(migrateDir);
    fs.writeFileSync(filepath, module);
  }

  static createTable(name: string, attributes, { tableName }) {
    const module = `const { Migration } = require('tinyrecord');

class ${name} extends Migration {
  async change() {
    await this.createTable('${tableName}', {}, t => {
${attributes.map(({ name, type }) => `      t.${type}('${name}');`).join('\n')}
      t.timestamps();
    });
  }
}

module.exports = ${name};
`;

    return module;
  }

  static migration(name: string, attributes, { action, tableName }) {
    let module = `const { Migration } = require('tinyrecord');

class ${name} extends Migration {`;

    if (action === 'add') {
      module += `
  async change() {
${attributes
        .map(
          ({ name, type }) =>
            `    await this.addColumn('${tableName}', '${name}', '${type}');`
        )
        .join('\n')}
  }`;
    } else if (action === 'remove') {
      module += `
  async change() {
${attributes
        .map(
          ({ name, type }) =>
            `    await this.removeColumn('${tableName}', '${name}', '${type}')`
        )
        .join('\n')}
  }`;
    }

    module += `\n}\n\nmodule.exports = ${name};`;

    return module;
  }

  static parseName(name: string) {
    const m1 = name.match(/^create(.+)/i);
    if (m1) {
      return {
        template: 'createTable',
        tableName: _.toLower(plural(_.snakeCase(m1[1])))
      };
    }

    const m2 = name.match(/^(add|remove).*(?:to|from)(.*)/i);
    if (m2) {
      return {
        template: 'migration',
        action: m2[1].toLowerCase(),
        tableName: m2[2].toLowerCase()
      };
    }
  }

  static parseAttributes(attributes) {
    return attributes.map(attr => {
      const s = attr.split(':');
      return {
        name: s[0],
        type: s[1]
      };
    });
  }
}
