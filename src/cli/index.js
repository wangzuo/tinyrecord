#!/usr/bin/env node

import program from 'commander';
import packageJSON from '../../package.json';
import DatabaseTasks from './DatabaseTasks';
import MigrationTasks from './MigrationTasks';

program.version(packageJSON.version);

program
  .command('db:create')
  .description('Create the database')
  .action(() => DatabaseTasks.create());

program
  .command('db:drop')
  .description('Drop the database')
  .action(() => DatabaseTasks.drop());

program
  .command('migration:create <filename> [attributes...]')
  .description('create new migration')
  .action(() => MigrationTasks.create());

program
  .command('db:migrate')
  .description(
    'Migrate the database (options: VERSION=x, VERBOSE=false, SCOPE=blog).'
  )
  .action(() => DatabaseTasks.migrate());

program
  .command('db:migrate:up')
  .description(`Runs the "up" for a given migration VERSION.`)
  .action();

program
  .command('db:migrate:down')
  .description(`Runs the "up" for a given migration VERSION.`)
  .action();

program
  .command('db:migrate:redo')
  .description(
    'Rollbacks the database one migration and re migrate up (options: STEP=x, VERSION=x).'
  );

program.parse(process.argv);
