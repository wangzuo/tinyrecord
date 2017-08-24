import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import { plural } from 'pluralize';
import MigrationTasks from './MigrationTasks';

export default class ModelTasks {
  static create(name, attributes) {
    MigrationTasks.create(`Create${_.capitalize(plural(name))}`, attributes);

    const module = this.createModel(name, attributes);
    const modelName = _.capitalize(name);
    const filename = `${modelName}.js`;
    const filepath = path.join(process.cwd(), 'models', filename);

    fs.writeFileSync(filepath, module);
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
}
