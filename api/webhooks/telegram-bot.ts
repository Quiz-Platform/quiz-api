import { VercelRequest, VercelResponse } from '@vercel/node';
import { config } from '../../src/app-config';
import { Question } from '../../src/models/questions.interface';
import { SupabaseQuestionsService } from '../../src/services/supabase-questions.service';
import { DatabaseService } from '../../src/services/database.service';
import { Logger } from '../../src/utils/logger';
import { AnswersWorker } from '../../src/workers/answers.worker';
import { AnswerRequest } from '../../src/models/answers.interface';
import { Context } from 'telegraf';
import { CallbackQuery } from 'telegraf/types';

const logger = new Logger();

/**
 * Init database service
 */
let _databaseService: DatabaseService | null = null;
async function getDb(): Promise<DatabaseService> {
  if (!_databaseService) {
    _databaseService = await DatabaseService.create();
  }
  return _databaseService;
}

const questionsService = new SupabaseQuestionsService(config);
const telegramBot = config.bot;

enum botCommands {
  START = 'start',
}

enum botTriggers {
  START = 'start_quiz',
}

/**
 * Reusable functions
 */
async function helloMessage(chatId): Promise<void> {
  const total = await questionsService.getQuestionsTotalCount(); // in future there may be different tests
  const message = "Мы поможем тебе!\n\n" +
      `Всего в тесте ${total} вопросов 🇮🇹\n` +
      "Для прохождения — просто выбери правильный ответ. Узнай свой уровень!\n\n" +
      "Жми — пройти тест👇";
  await telegramBot.telegram.sendMessage(chatId, message, {
    reply_markup: {
      inline_keyboard: [
        [{text: "Пройти тест 📝", callback_data: botTriggers.START}]
      ]
    }
  });
}

async function saveQuestion(ctx: Context<any> | Context, payload: AnswerRequest): Promise<void> {
  if (!payload) return;
  const { questionId, answerId, telegramUser, token, sessionId } = payload;

  logger.log({
    type: 'event',
    message: `Got answer ${answerId} for question ${questionId} from user ${telegramUser}`
  });

  const db = await getDb();

  logger.log({ type: "event", message: `User ${telegramUser} answered q${questionId} with a${answerId}` });
  const userAnswer = {
    questionId,
    answerId,
    isCorrect: null,
    createdAt: new Date().toISOString(),
  };

  const newAnswerId = await db.createUserAnswer(sessionId, telegramUser, userAnswer);

  if (newAnswerId) {
    const worker = new AnswersWorker();
    await worker.process(payload, newAnswerId);
  } else {
    logger.log({ type: 'error', message: 'createUserAnswer returned null/failed' });
  }
}

// Some Telegram users may only have a phone number
function usernameFallback(ctx: Context): string {
  const chatId = ctx.chat?.id;
  const user = "callback_query" in ctx.update
    ? ctx.update.callback_query.from
    : ctx.from!;
  return user?.username ?? String(user?.id ?? chatId);
}

async function initNewSession(user, chatId): Promise<void> {
  const db = await getDb();
  const sessionId = `${user}_${chatId}_${Date.now()}`; // TODO: introduce Telegraph session storage
  await db.createNewSession(sessionId, user); // TODO: introduce sessions expire time
  await db.setUserProgress(sessionId, user, 0);
}

/**
 * Register bot handlers
 */
function registerBot(): void {
  // First time or every time a bot restarts
  telegramBot.command(botCommands.START, async (ctx: Context): Promise<void> => {
    const chatId = ctx.chat?.id ?? null;
    if (chatId === null) return;
    const user = usernameFallback(ctx);

    await initNewSession(user, chatId);
    await helloMessage(chatId);
  });

  // Every time a user runs quiz scenario
  telegramBot.action(botTriggers.START, async (ctx: Context): Promise<void> => {
    const chatId = ctx.chat?.id ?? null;
    if (chatId === null) return;
    const user = usernameFallback(ctx);

    const db = await getDb();
    const sessionId = await db.getLatestUserSessionId(user)
    await ctx.answerCbQuery();
    const currentQuestionId = await db.getUserProgress(sessionId)
    const total = await questionsService.getQuestionsTotalCount();

    await db.setUserProgress(sessionId, user, currentQuestionId);
    await ctx.reply(`Всего в тесте ${total} вопросов 🤩\nВыбери правильный ответ⬇`);
    await sendQuizQuestionToChat(String(chatId), currentQuestionId);
  });

  // Callback query
  telegramBot.on('callback_query', async (ctx: Context): Promise<void> => {
    const query = ctx.callbackQuery as CallbackQuery | undefined;
    if (!query) return;

    if ((query as CallbackQuery)['data'] === undefined) {
      await ctx.answerCbQuery('Вместо текста, пожалуйста, выберите один из вариантов');
      return;
    }

    const chatId = ctx.chat?.id ?? null;
    if (chatId === null) return;
    const user = usernameFallback(ctx);

    await ctx.answerCbQuery();

    const rawData = (query as any).data;
    const answerId = Number(rawData);
    if (Number.isNaN(answerId)) {
      logger.log({ type: 'error', message: `Invalid answerId payload: ${rawData}` });
      return;
    }

    const db = await getDb();
    const sessionId = await db.getLatestUserSessionId(user);
    let currentQuestionId = await db.getUserProgress(sessionId);
    const total = await questionsService.getQuestionsTotalCount();

    const payload: AnswerRequest = {
      timestamp: Math.floor(Date.now() / 1000),
      sessionId: sessionId,
      telegramUser: user,
      questionId: currentQuestionId!,
      answerId,
      token: config.apiToken,
    };

    // save answer and run worker to check user's response
    await saveQuestion(ctx, payload);

    // compute progress
    const nextQuestionId = (currentQuestionId ?? 0) + 1;

    // resulting chain
    if (currentQuestionId === total) {
      await sendQuizFinishMessage(String(chatId));
      await sendQuizResultsMessage(String(chatId), sessionId, user);
      return;
    }

    // load next question and advance
    if (currentQuestionId < total) {
      await db.setUserProgress(sessionId, user, nextQuestionId);
      await sendQuizQuestionToChat(String(chatId), nextQuestionId);
    }
  });
}

/**
 * Send a single question to chat
 */
async function sendQuizQuestionToChat(chatId: string, questionId: number): Promise<void> {
  logger.log({ type: 'event', message: `Sending question ${questionId} to chat ${chatId}` });

  const question: Question = await questionsService.getQuestionById(questionId);

  await telegramBot.telegram.sendMessage(chatId, `Вопрос №${questionId + 1}\n${question.text}`, {
    reply_markup: {
      inline_keyboard: question.options.map((o) => [{ text: o.text, callback_data: o.id.toString() }]),
    },
  });
}

/**
 * Resulting message chain
 */
async function sendQuizFinishMessage(chatId: string): Promise<void> {
  await telegramBot.telegram.sendMessage(
    chatId,
    "🎉 Тест пройден!\n\nВ течение минуты тут появятся твои результаты"
  );
}

async function sendQuizResultsMessage(
  chatId: string,
  sessionId: string,
  telegramUser: string
): Promise<void> {
  const db = await getDb();
  const stats = await db.getQuizStatByUserSession(sessionId, telegramUser);

  if (!stats) {
    await telegramBot.telegram.sendMessage(
      chatId,
      "Произошла ошибка: бот не смог загрузить результаты теста. \nНе перееживайте, мы свяжемся с вами и пришлем результаты"
    );
    return;
  }

  const total =  await questionsService.getQuestionsTotalCount();
  const { correctAnswers, proficiencyLevel } = stats;

  const resultMessagePt1 = `🎉 Вы прошли тест!\n\n` + `Правильных ответов: ${correctAnswers} из ${total} `;
  const resultMessagePt2 = proficiencyLevel !== null ? `\nВаш уровень: ${proficiencyLevel}` : '';

  const resultMessage = `${resultMessagePt1}${resultMessagePt2}`;

  await telegramBot.telegram.sendMessage(chatId, resultMessage);
}

// Register bot handlers once (safe in serverless)
registerBot();

/**
 * Main webhook handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'POST') {
    try {
      await telegramBot.handleUpdate(req.body);
      res.status(200).end();
    } catch (e) {
      logger.log({ type: 'error', message: `Webhook error: ${e}` });
      res.status(500).end();
    }
  } else {
    res.status(200).send('OK');
  }
}
