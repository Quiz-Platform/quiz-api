import { VercelRequest, VercelResponse } from '@vercel/node';
import { config } from '../../src/app-config';
import { Question } from '../../src/models/questions.interface';
import { SupabaseQuestionsService } from '../../src/services/supabase-questions.service';
import { DatabaseService } from '../../src/services/database.service';
import { Logger } from '../../src/utils/logger';
import { AnswersWorker } from '../../src/workers/answers.worker';
import { AnswerRequest } from '../../src/models/answers.interface';
import { Context } from 'telegraf';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';

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

/**
 * Global runtime state (kept intentionally simple).
 * USER is telegramUser (username or id as string).
 */
let CHAT_ID: number | null = null;
let USER: string | null = null; // telegramUser
let SESSION_ID: string | null = null;
let CURRENT_QUESTION_ID: number | null = null;
let TOTAL_QUESTIONS: number | null = null;

enum botCommands {
  START = 'start',
}

enum botTriggers {
  START = 'start_quiz',
}

/**
 * Hello message
 */
async function helloMessage(chatId): Promise<void> {
  const message = "Мы поможем тебе!\n\n" +
      `Всего в тесте ${TOTAL_QUESTIONS} вопросов 🇮🇹\n` +
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

/**
 * Save question
 */
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

/**
 * Register bot handlers
 */
function registerBot(): void {
  telegramBot.command(botCommands.START, async (ctx: Context): Promise<void> => {
    CHAT_ID = ctx.chat?.id ?? null;
    if (CHAT_ID === null) return;
    await helloMessage(CHAT_ID);
  });

  // Set initial state
  telegramBot.action(botTriggers.START, async (ctx: Context): Promise<void> => {
    await ctx.answerCbQuery();

    CHAT_ID = ctx.chat?.id ?? null;
    if (CHAT_ID === null) return;

    const user = "callback_query" in ctx.update
      ? ctx.update.callback_query.from
      : ctx.from!;

    USER = user?.username ?? String(user?.id ?? CHAT_ID);
    SESSION_ID = `${USER}_${CHAT_ID}_${Date.now()}`;
    CURRENT_QUESTION_ID = 0;

    const db = await getDb();
    TOTAL_QUESTIONS = TOTAL_QUESTIONS ?? (await questionsService.getQuestionsTotalCount());

    // store initial progress: sessionId, telegramUser, question number
    await db.setUserProgress(SESSION_ID, USER, CURRENT_QUESTION_ID);

    await ctx.reply(`Всего в тесте ${TOTAL_QUESTIONS} вопросов 🤩\nВыбери правильный ответ⬇`);

    await sendQuizQuestionToChat(String(CHAT_ID), CURRENT_QUESTION_ID);
  });

  telegramBot.on('callback_query', async (ctx: Context): Promise<void> => {
    const query = ctx.callbackQuery as CallbackQuery | undefined;
    if (!query) return;

    // Narrow callback query to DataCallbackQuery by checking data existence
    if ((query as any).data === undefined) {
      await ctx.answerCbQuery('Вместо текста, пожалуйста, выберите один из вариантов');
      return;
    }

    await ctx.answerCbQuery();

    // ensure CHAT_ID / USER / SESSION_ID available; try to restore from DB if missing
    if (!CHAT_ID) {
      CHAT_ID = Number(ctx.callbackQuery?.message?.chat?.id ?? null);
      if (!CHAT_ID) return;
    }

    if (!USER) {
      const from = ctx.callbackQuery?.from;
      USER = from?.username ?? String(from?.id ?? CHAT_ID);
    }

    if (!SESSION_ID) {
      // fallback to combination if not set
      SESSION_ID = `${USER}_${CHAT_ID}_${Date.now()}`;
    }

    // parse answer id safely
    const rawData = (query as any).data;
    const answerId = Number(rawData);
    if (Number.isNaN(answerId)) {
      logger.log({ type: 'error', message: `Invalid answerId payload: ${rawData}` });
      return;
    }

    // Restore CURRENT_QUESTION_ID from DB if missing
    const db = await getDb();
    if (CURRENT_QUESTION_ID == null) {
      const persisted = await db.getUserProgress(SESSION_ID);
      if (persisted == null) {
        // if still null, fallback to 0
        CURRENT_QUESTION_ID = 0;
      } else {
        CURRENT_QUESTION_ID = persisted;
      }
    }

    const payload: AnswerRequest = {
      timestamp: Math.floor(Date.now() / 1000),
      sessionId: SESSION_ID,
      telegramUser: USER,
      questionId: CURRENT_QUESTION_ID!,
      answerId,
      token: config.apiToken,
    };

    // save answer and run worker to check user's response
    await saveQuestion(ctx, payload);

    // compute progress
    const nextQuestionId = (CURRENT_QUESTION_ID ?? 0) + 1;

    if ((CURRENT_QUESTION_ID ?? 0) >= (TOTAL_QUESTIONS - 1)) {
      // last question answered
      await sendQuizFinishMessage(String(CHAT_ID));
      await sendQuizResultsMessage(String(CHAT_ID), SESSION_ID, USER);
      // clear session state (optional)
      CURRENT_QUESTION_ID = null;
      SESSION_ID = null;
      USER = null;
      CHAT_ID = null;
      return;
    }

    // persist next question and advance
    await db.setUserProgress(SESSION_ID, USER, nextQuestionId);
    CURRENT_QUESTION_ID = nextQuestionId;

    await sendQuizQuestionToChat(String(CHAT_ID), nextQuestionId);
  });
}

/**
 * Send a single question to chat
 */
async function sendQuizQuestionToChat(chatId: string, questionId: number): Promise<void> {
  logger.log({ type: 'event', message: `Sending question ${questionId} to chat ${chatId}` });

  const question: Question = await questionsService.getQuestionById(questionId);

  await telegramBot.telegram.sendMessage(chatId, question.text, {
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

  // Use TOTAL_QUESTIONS that was computed earlier; fallback to DB count if missing
  const total = TOTAL_QUESTIONS ?? (await questionsService.getQuestionsTotalCount());
  const { correctAnswers, proficiencyLevel } = stats;

  const resultMessage =
    `🎉 Вы прошли тест!\n\n` + `Правильных ответов: ${correctAnswers} из ${total}\n` + `Ваш уровень: ${proficiencyLevel}`;

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
