import 'dotenv/config';

export default {
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
  },
};
