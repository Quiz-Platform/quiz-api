exports.up = async function(knex) {
  const exists = await knex.schema.hasTable("progress");
  if (!exists) {
    await knex.schema.createTable("progress", (table) => {
      table.text("session_id").primary();
      table.text("telegram_user").notNullable();
      table.integer("current_question").notNullable().defaultTo(1);
      table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

      table
        .foreign("session_id")
        .references("id")
        .inTable("sessions")
        .onDelete("NO ACTION")
        .onUpdate("NO ACTION");
    });
  }
}

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists("progress");
}
