exports.up = async function(knex) {
  const hasId = await knex.schema.hasColumn('answers', 'id');
  if (hasId) {
    await knex.schema.alterTable('answers', table => {
      table.dropColumn('id');
    });
  }

  await knex.schema.alterTable('answers', table => {
    table.bigIncrements('id').primary();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('answers', table => {
    table.dropColumn('id');
  });

  await knex.schema.alterTable('answers', table => {
    table.integer('id').notNullable();
  });
};
