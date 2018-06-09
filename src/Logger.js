// @flow
import _ from 'lodash';
import winston from 'winston';
import colors from 'colors/safe';

const CONFIG = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4
  },
  colors: {
    fatal: 'magenta',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue'
  }
};

export default class Logger {
  constructor() {
    this.logger = new winston.Logger({
      transports: [
        new winston.transports.Console({
          colorize: true,

          formatter(options) {
            return options.message;
          }
        })
      ],
      levels: CONFIG.levels,
      colors: CONFIG.colors
    });
    this.logger.transports.console.level = 'debug';

    // todo
    this.info = this.logger.info;
  }

  sql(options = {}, duration) {
    const { sql } = options;
    const typeCastedBinds = options.typeCastedBinds || [];
    const color = this.sqlColor(sql);
    this.logger.debug(
      `${colors.red(`(${_.round(duration, 1)}ms)`)}  ${colors[color](
        sql
      )} ${typeCastedBinds.join(', ')}`
    );
  }

  sqlColor(sql: string): string {
    if (sql.match(/rollback/im)) {
      return 'red';
    } else if (sql.match(/^\s*select/i)) {
      return 'blue';
    } else if (sql.match(/^\s*insert/i)) {
      return 'green';
    } else if (sql.match(/^\s*update/i)) {
      return 'yellow';
    } else if (sql.match(/^\s*delete/i)) {
      return 'red';
    } else if (sql.match(/^\s*transaction/i)) {
      return 'cyan';
    }

    return 'magenta';
  }
}
