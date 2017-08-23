#!/usr/bin/env node

import program from 'commander';
import pkg from '../../package.json';
import DatabaseTasks from './DatabaseTasks';
import MigrationTasks from './MigrationTasks';

process.on('unhandledRejection', err => {
  console.error(err);
});

program.version(pkg.version);

program
  .command('db:create')
  .description('Create the database')
  .action(() => DatabaseTasks.create());

program
  .command('db:drop')
  .description('Drop the database')
  .action(() => DatabaseTasks.drop());

program
  .command('db:migrate:reset')
  .description(
    `Resets your database using your migrations for the current environment`
  )
  .action(() => DatabaseTasks.migrateReset());

program
  .command('migration:create <filename> [attributes...]')
  .description('create new migration file')
  .action((filename, attributes) =>
    MigrationTasks.create(filename, attributes)
  );

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
