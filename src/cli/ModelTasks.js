import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import { plural } from 'pluralize';
import MigrationTasks from './MigrationTasks';

export default class ModelTasks {
  static index() {
    const files = fs.readdirSync(path.join(process.cwd(), 'models'));
    const module = this.createIndex(files);
    const filepath = path.join(process.cwd(), 'models', 'index.js');

    fs.writeFileSync(filepath, module);
  }

  static create(name, attributes) {
    MigrationTasks.create(`Create${_.capitalize(plural(name))}`, attributes);

    const module = this.createModel(name, attributes);
    const modelName = _.capitalize(name);
    const filename = `${modelName}.js`;
    const filepath = path.join(process.cwd(), 'models', filename);

    fs.writeFileSync(filepath, module);

    this.index();
  }

  static createModel(name, attributes) {
    const modelName = _.capitalize(name);
    const tableName = _.toLower(plural(name));
    const module = `const { Base } = require('tinyrecord');

class ${modelName} extends Base {}
${modelName}.tableName = '${tableName}';

module.exports = ${modelName};
`;

    return module;
  }

  static createIndex(files) {
    return files
      .filter(x => x !== 'index.js')
      .sort()
      .map(file => {
        const module = path.basename(file, '.js');
        return `exports.${module} = require('./${module}');\n`;
      })
      .join('');
  }
}
