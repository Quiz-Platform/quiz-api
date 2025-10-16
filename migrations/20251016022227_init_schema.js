export async function up(knex) {
  // Historical migration: initial database structure (deprecated)
  // The tables `sessions`, `questions`, and `answers` were originally created here,
  // but parts of the schema have since changed.
  //
  // Kept for reference only — do not apply this migration again.

  // await knex.schema.createTable('sessions', (table) => {
  //   table.text('id').primary();
  //   table.text('telegram_user').notNullable();
  //   table.timestamp('created_at').defaultTo(knex.fn.now());
  // });

  // The `questions` table is now created in a separate migration
  // and includes a JSONB `options` column.
  // The old definition is left here for reference.
  //
  // await knex.schema.createTable('questions', (table) => {
  //   table.integer('id').primary();
  //   table.text('text').notNullable();
  // });

  // The `options` table is no longer used.
  // It previously stored answer variants for each question.
  // Left commented for historical context.
  //
  // await knex.schema.createTable('options', (table) => {
  //   table.increments('id').primary();
  //   table
  //     .integer('question_id')
  //     .references('id')
  //     .inTable('questions')
  //     .onDelete('CASCADE')
  //     .notNullable();
  //   table.text('text').notNullable();
  //   table.boolean('is_true').notNullable();
  // });

  // The `answers` table remains valid.
  // It references `sessions` and `questions`.
  //
  // await knex.schema.createTable('answers', (table) => {
  //   table.bigInteger('id').primary();
  //   table
  //     .text('session_id')
  //     .references('id')
  //     .inTable('sessions')
  //     .onDelete('CASCADE')
  //     .notNullable();
  //   table
  //     .integer('question_id')
  //     .references('id')
  //     .inTable('questions')
  //     .notNullable();
  //   table.boolean('is_correct').notNullable();
  //   table.timestamp('created_at').defaultTo(knex.fn.now());
  // });
}

export async function down(knex) {
  // Historical migration — for reference only.
  // The old rollback order is kept commented below.
  //
  // await knex.schema.dropTableIfExists('answers');
  // await knex.schema.dropTableIfExists('options');
  // await knex.schema.dropTableIfExists('questions');
  // await knex.schema.dropTableIfExists('sessions');
}
