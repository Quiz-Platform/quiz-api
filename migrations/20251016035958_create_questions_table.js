exports.up = async function (knex) {
  await knex.schema.createTable('questions', (table) => {
    table.integer('id').primary();
    table.text('text').notNullable();
    table.jsonb('options').notNullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('questions');
};
