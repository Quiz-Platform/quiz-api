exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('answers', 'answer_id');
  if (!hasColumn) {
    await knex.schema.alterTable('answers', table => {
      table.integer('answer_id').notNullable().defaultTo(0);
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('answers', 'answer_id');
  if (hasColumn) {
    await knex.schema.alterTable('answers', table => {
      table.dropColumn('answer_id');
    });
  }
};
