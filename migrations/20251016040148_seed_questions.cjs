const questions = require('../src/services/questions.mock.json');

exports.up = async function (knex) {
  for (const q of questions) {
    await knex('questions').insert({
      id: q.id,
      text: q.text,
      options: JSON.stringify(q.options),
    });
  }
};

exports.down = async function (knex) {
  await knex('questions').del();
};
