#!/usr/bin/env node

import program from 'commander';
import packageJSON from '../../package.json';
import * as db from './db';

program.version(packageJSON.version);

program
  .command('db:create')
  .description('Create the database')
  .action(db.create.default);

program
  .command('db:drop')
  .description('Drop the database')
  .action(db.drop.default);

program
  .command('db:migrate')
  .description(
    'Migrate the database (options: VERSION=x, VERBOSE=false, SCOPE=blog).'
  )
  .action(db.migrate.default);

program
  .command('db:migrate:up')
  .description(`Runs the "up" for a given migration VERSION.`)
  .action(db.migrate.up);

program
  .command('db:migrate:down')
  .description(`Runs the "up" for a given migration VERSION.`)
  .action(db.migrate.down);

program
  .command('db:migrate:redo')
  .description(
    'Rollbacks the database one migration and re migrate up (options: STEP=x, VERSION=x).'
  );

program.parse(process.argv);
