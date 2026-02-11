exports.up = async function (knex) {
  await knex.schema.createTable('sessions', (table) => {
    table.text('id').primary();
    table.text('telegram_user').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('questions', (table) => {
    table.integer('id').primary();
    table.text('text').notNullable();
    table.jsonb('options').notNullable();
  });

  await knex.schema.createTable('answers', (table) => {
    table.bigInteger('id').primary();
    table
      .text('session_id')
      .references('id')
      .inTable('sessions')
      .onDelete('CASCADE')
      .notNullable();
    table
      .integer('question_id')
      .references('id')
      .inTable('questions')
      .notNullable();
    table.boolean('is_correct').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('questions');
  await knex.schema.dropTableIfExists('answers');
  await knex.schema.dropTableIfExists('sessions');
}
