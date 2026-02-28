/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex('proficiency').del();
  await knex('proficiency').insert([
    {
      id: 'A1',
      percentage: 30
    },
    {
      id: 'A2',
      percentage: 50
    },
    {
      id: 'B1',
      percentage: 80
    },
    {
      id: 'B2',
      percentage: 90
    }
  ]);
}
