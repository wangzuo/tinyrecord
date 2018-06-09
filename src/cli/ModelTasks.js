// @flow
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import { plural } from 'pluralize';
import MigrationTasks from './MigrationTasks';

export default class ModelTasks {
  static index() {
    const files = fs.readdirSync(path.join(process.cwd(), 'models'));
    const module = this.createIndex(files);
    const filepath = path.join(process.cwd(), 'models', 'index.js');

    fs.writeFileSync(filepath, module);
  }

  static modelName(name: string) {
    return _.upperFirst(_.camelCase(name));
  }

  static tableName(name: string) {
    return _.toLower(plural(_.snakeCase(name)));
  }

  static create(name: string, attributes) {
    const modelName = this.modelName(name);
    MigrationTasks.create(`Create${plural(modelName)}`, attributes);

    const module = this.createModel(name, attributes);
    const filename = `${modelName}.js`;
    const modelDir = path.join(process.cwd(), 'models');
    const filepath = path.join(modelDir, filename);

    mkdirp.sync(modelDir);
    fs.writeFileSync(filepath, module);

    this.index();
  }

  static createModel(name: string, attributes) {
    const modelName = this.modelName(name);
    const tableName = this.tableName(name);
    const module = `const { Base } = require('tinyrecord');

class ${modelName} extends Base {}
${modelName}.tableName = '${tableName}';

module.exports = ${modelName};
`;

    return module;
  }

  static createIndex(files: Array<string>) {
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
