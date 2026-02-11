import 'dotenv/config';

export default {
  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_CONNECTION_STRING,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
  development: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_CONNECTION_STRING,
      ssl: { rejectUnauthorized: false },
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
};
