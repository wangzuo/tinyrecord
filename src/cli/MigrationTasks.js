import fs from 'fs';
import path from 'path';
import moment from 'moment';

export default class MigrationTasks {
  static create(name, attributes) {
    const options = this.parseName(name);
    const attrs = this.parseAttributes(attributes);
    const ts = moment().format('YYYYMMDDHHmmss');
    const filename = `${ts}-${name}.js`;

    const module = this[options.template](name, attrs, options);
    const filepath = path.join(process.cwd(), './db/migrate', filename);

    fs.writeFileSync(filepath, module);
  }

  static createTable(name, attributes, { tableName }) {
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

  static migration(name, attributes, { action, tableName }) {
    return ``;
  }

  static parseName(name) {
    const m1 = name.match(/^create(.+)/i);
    if (m1) {
      return { template: 'createTable', tableName: m1[1].toLowerCase() };
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
