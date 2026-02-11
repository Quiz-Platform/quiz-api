/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex('questions').del();

  await knex('questions').insert([
    {
      id: 0,
      text: 'Eros Ramazzotti ...... un cantante molto famoso.',
      options: JSON.stringify([
        { id: 0, text: "c'è", isTrue: false },
        { id: 1, text: 'è', isTrue: true },
        { id: 2, text: 'ha', isTrue: false }
      ])
    },
    {
      id: 1,
      text: 'Io ...... 28 anni.',
      options: JSON.stringify([
        { id: 0, text: 'ho', isTrue: true },
        { id: 1, text: 'sono', isTrue: false },
        { id: 2, text: 'a', isTrue: false }
      ])
    },
    {
      id: 2,
      text: '...... fratello di Maria è molto carino.',
      options: JSON.stringify([
        { id: 0, text: 'la', isTrue: false },
        { id: 1, text: 'il', isTrue: true },
        { id: 2, text: 'lo', isTrue: false }
      ])
    },
    {
      id: 3,
      text: 'Paolo ha ...... macchina rossa.',
      options: JSON.stringify([
        { id: 0, text: "un'", isTrue: false },
        { id: 1, text: 'un', isTrue: false },
        { id: 2, text: 'una', isTrue: true }
      ])
    },
    {
      id: 4,
      text: '...... lavora in un ufficio importante.',
      options: JSON.stringify([
        { id: 0, text: 'Mia padre', isTrue: false },
        { id: 1, text: 'Il mio padre', isTrue: false },
        { id: 2, text: 'Mio padre', isTrue: true }
      ])
    },
    {
      id: 5,
      text: 'Io ...... italiano da tre anni.',
      options: JSON.stringify([
        { id: 0, text: 'studia', isTrue: false },
        { id: 1, text: 'studio', isTrue: true },
        { id: 2, text: 'studiam', isTrue: false }
      ])
    },
    {
      id: 6,
      text: 'I miei amici ...... tutte le sere.',
      options: JSON.stringify([
        { id: 0, text: 'escono', isTrue: true },
        { id: 1, text: 'usciono', isTrue: false },
        { id: 2, text: 'uscono', isTrue: false }
      ])
    },
    {
      id: 7,
      text: 'Cinzia ...... una lettera ai suoi genitori ogni settimana.',
      options: JSON.stringify([
        { id: 0, text: 'scriva', isTrue: false },
        { id: 1, text: 'scrive', isTrue: true },
        { id: 2, text: 'scrivi', isTrue: false }
      ])
    },
    {
      id: 8,
      text: 'Cameriere, vorrei un piatto ...... spaghetti, per favore.',
      options: JSON.stringify([
        { id: 0, text: 'di', isTrue: true },
        { id: 1, text: 'con', isTrue: false },
        { id: 2, text: 'al', isTrue: false }
      ])
    },
    {
      id: 9,
      text: 'Noi abitiamo vicino ...... stazione.',
      options: JSON.stringify([
        { id: 0, text: 'della', isTrue: false },
        { id: 1, text: 'alla', isTrue: true },
        { id: 2, text: 'di', isTrue: false }
      ])
    },
    {
      id: 10,
      text: '...... parlare italiano?',
      options: JSON.stringify([
        { id: 0, text: 'puoi', isTrue: false },
        { id: 1, text: 'conosci', isTrue: false },
        { id: 2, text: 'sai', isTrue: true }
      ])
    },
    {
      id: 11,
      text: "L'anno scorso ...... a Roma.",
      options: JSON.stringify([
        { id: 0, text: 'siamo andati', isTrue: true },
        { id: 1, text: 'abbiamo andati', isTrue: false },
        { id: 2, text: 'siamo andato', isTrue: false }
      ])
    },
    {
      id: 12,
      text: 'Ieri sera ...... a Sandra, ma non era in casa.',
      options: JSON.stringify([
        { id: 0, text: 'ho telefonato', isTrue: true },
        { id: 1, text: 'ho telefonata', isTrue: false },
        { id: 2, text: 'sono telefonato', isTrue: false }
      ])
    },
    {
      id: 13,
      text: "L'anno prossimo io e Mario ......",
      options: JSON.stringify([
        { id: 0, text: 'si sposeremo', isTrue: false },
        { id: 1, text: 'ci sposaremo', isTrue: false },
        { id: 2, text: 'ci sposeremo', isTrue: true }
      ])
    },
    {
      id: 14,
      text: 'Quel ragazzo, non ...... voglio vedere mai più!',
      options: JSON.stringify([
        { id: 0, text: 'lo', isTrue: true },
        { id: 1, text: 'ci', isTrue: false },
        { id: 2, text: 'gli', isTrue: false }
      ])
    },
    {
      id: 15,
      text: 'Ho telefonato a Simona e ...... ho detto tutta la verità.',
      options: JSON.stringify([
        { id: 0, text: 'la', isTrue: false },
        { id: 1, text: 'le', isTrue: true },
        { id: 2, text: 'gli', isTrue: false }
      ])
    },
    {
      id: 16,
      text: 'Non ...... posso più di tutto questo rumore!',
      options: JSON.stringify([
        { id: 0, text: 'ci', isTrue: false },
        { id: 1, text: 'lo', isTrue: false },
        { id: 2, text: 'ne', isTrue: true }
      ])
    },
    {
      id: 17,
      text: 'Mio fratello è ...... tuo cugino.',
      options: JSON.stringify([
        { id: 0, text: 'più alto che', isTrue: false },
        { id: 1, text: 'il più alto di', isTrue: false },
        { id: 2, text: 'più alto di', isTrue: true }
      ])
    },
    {
      id: 18,
      text: 'Il libro ...... mi hai tanto parlato era veramente interessante.',
      options: JSON.stringify([
        { id: 0, text: 'che', isTrue: false },
        { id: 1, text: 'di cui', isTrue: true },
        { id: 2, text: 'chi', isTrue: false }
      ])
    },
    {
      id: 19,
      text: 'Pronto? Sì, la Signora è in casa, ...... passo subito.',
      options: JSON.stringify([
        { id: 0, text: 'gliela', isTrue: true },
        { id: 1, text: 'la', isTrue: false },
        { id: 2, text: 'glila', isTrue: false }
      ])
    },
    {
      id: 20,
      text: 'Marco, ...... subito a letto!',
      options: JSON.stringify([
        { id: 0, text: 'vai', isTrue: false },
        { id: 1, text: 'anda', isTrue: false },
        { id: 2, text: "va'", isTrue: true }
      ])
    },
    {
      id: 21,
      text: "Signore, ...... mi può dire l'ora?",
      options: JSON.stringify([
        { id: 0, text: 'scusami', isTrue: false },
        { id: 1, text: 'mi scusa', isTrue: false },
        { id: 2, text: 'mi scusi', isTrue: true }
      ])
    },
    {
      id: 22,
      text: 'Cristina ...... fare un corso di cucina, ma non ha tempo libero.',
      options: JSON.stringify([
        { id: 0, text: 'volerebbe', isTrue: false },
        { id: 1, text: 'vorrebbe', isTrue: true },
        { id: 2, text: 'vorrei', isTrue: false }
      ])
    },
    {
      id: 23,
      text: 'Credo che i nostri amici ...... questa mattina.',
      options: JSON.stringify([
        { id: 0, text: 'partano', isTrue: true },
        { id: 1, text: 'partono', isTrue: false },
        { id: 2, text: 'partiranno', isTrue: false }
      ])
    },
    {
      id: 24,
      text: 'Pensavo che ...... anche il tuo amico alla festa.',
      options: JSON.stringify([
        { id: 0, text: 'veniva', isTrue: false },
        { id: 1, text: 'venisse', isTrue: true },
        { id: 2, text: 'venga', isTrue: false }
      ])
    },
    {
      id: 25,
      text: 'Sarei venuta al concerto, se ...... i biglietti.',
      options: JSON.stringify([
        { id: 0, text: 'trovassi', isTrue: false },
        { id: 1, text: 'avrei trovato', isTrue: false },
        { id: 2, text: 'avessi trovato', isTrue: true }
      ])
    },
    {
      id: 26,
      text: 'Compreremo la casa, ...... la banca ci faccia un prestito.',
      options: JSON.stringify([
        { id: 0, text: 'purché', isTrue: true },
        { id: 1, text: 'affinché', isTrue: false },
        { id: 2, text: 'perché', isTrue: false }
      ])
    },
    {
      id: 27,
      text: 'Non ho capito ...... di quello che ha detto il professore.',
      options: JSON.stringify([
        { id: 0, text: 'nessuno', isTrue: false },
        { id: 1, text: 'niente', isTrue: true },
        { id: 2, text: 'qualcosa', isTrue: false }
      ])
    },
    {
      id: 28,
      text: 'Avrei fatto ...... cosa per te!',
      options: JSON.stringify([
        { id: 0, text: 'qualunque', isTrue: true },
        { id: 1, text: 'ogni', isTrue: false },
        { id: 2, text: 'tutto', isTrue: false }
      ])
    }
  ]);
};
