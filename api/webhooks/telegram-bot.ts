import {VercelRequest, VercelResponse} from '@vercel/node';
import { config } from '../../src/app-config';
import { Question } from '../../src/models/questions.interface';
import { SupabaseQuestionsService } from '../../src/services/supabase-questions.service';
import { DatabaseService } from '../../src/services/database.service';
import { Logger } from '../../src/utils/logger';
import {AnswersWorker} from '../../src/workers/answers.worker';
import {AnswerRequest} from '../../src/models/answers.interface';
import {Context} from 'telegraf';

/**
 * Global variables and constants
 */
const logger = new Logger();
let CHAT_ID: number;
let USER: string;
let SESSION_ID: string;
let TOTAL_QUESTIONS: number;

/**
 * Init database service
 */
let databaseService: DatabaseService | null = null;
async function getDb(): Promise<DatabaseService> {
  if (!databaseService) {
    databaseService = await DatabaseService.create();
  }
  return databaseService;
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
 * Hello message
 */
async function helloMessage(chatId): Promise<void> {
  const message = "Мы поможем тебе!\n\n" +
      "Всего в тесте 30 вопросов 🇮🇹\n" +
      "Для прохождения — просто выбери правильный ответ. После мы проверим его и определим твой уровень в течение 24 часов!\n\n" +
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
async function saveQuestion(ctx: Context<any> | Context, payload) {
  if (!payload) return;
  const { questionId, answerId, telegramUser, token, sessionId } = payload;

  logger.log({
    type: 'event',
    message: `Got answer ${answerId} for question ${questionId} from user ${telegramUser}`
  });

  logger.log({ type: "event", message: `User ${telegramUser} answered q${questionId} with a${answerId}` });
  const newAnswerId = await databaseService.createUserAnswer(sessionId, telegramUser, {
    questionId,
    answerId,
    isCorrect: null,
    createdAt: `${new Date().toISOString()}`,
  });

  if (newAnswerId) {
    const worker = new AnswersWorker();
    await worker.process(payload as AnswerRequest, newAnswerId);
  }
}

/**
 * Register bot handlers
 */
function registerBot(): void {
  telegramBot.command(botCommands.START, async (ctx) => {
    CHAT_ID = ctx.chat.id
    await helloMessage(CHAT_ID);
  });

  // Set initial state
  telegramBot.action(botTriggers.START, async (ctx) => {
    await ctx.answerCbQuery();
    const chatId = CHAT_ID.toString();
    const user = ctx.update.callback_query.from;

    const db = await getDb();
    await db.setUserProgress(chatId, chatId, 1);

    await ctx.reply("Всего в тесте 30 вопросов 🤩\nВыбери правильный ответ⬇");
    await sendQuizQuestionToChat(chatId, 1);

    SESSION_ID = `${user.id}${ctx.chat.id}${new Date().toISOString()}`;
  });

  // Callback query trigger handler
  telegramBot.on('callback_query', async (ctx) => {
    const query = ctx.callbackQuery;
    if (!query || !('data' in query)) return;
    await ctx.answerCbQuery();
    // @ts-ignore
    const answerId = Number(ctx.callbackQuery.data);
    const chatId = ctx.chat.id.toString();
    const user = ctx.update.callback_query.from;
    USER = user.username ?? user.id.toString();

    const currentQuestionId = await databaseService.getUserProgress(chatId);


    const payload = {
      questionId: currentQuestionId,
      answerId,
      USER,
      token: config.apiToken,
      sessionId: SESSION_ID,
    };

    await saveQuestion(ctx, payload);

    TOTAL_QUESTIONS = await questionsService.getQuestionsTotalCount();
    const nextQuestionId = currentQuestionId + 1;

    if (nextQuestionId > TOTAL_QUESTIONS) {
      await sendQuizFinishMessage(chatId);
      await sendQuizResultsMessage(chatId, SESSION_ID, USER);
    } else {
      await sendQuizQuestionToChat(chatId, nextQuestionId);
    }

    await databaseService.setUserProgress(chatId, chatId, nextQuestionId);
  });
}

/**
 * Send single question
 */
async function sendQuizQuestionToChat(chatId: string, questionId: number): Promise<void> {
  logger.log({
    type: 'event',
    message: `Sending question ${questionId} to chat ${chatId}`
  });

  const question: Question = await questionsService.getQuestionById(questionId);

  await telegramBot.telegram.sendMessage(chatId, question.text, {
    reply_markup: {
      inline_keyboard: question.options.map((o) => [
        { text: o.text, callback_data: o.id.toString() }
      ])
    }
  });
}

/**
 * Resulting message chain
 */
async function sendQuizFinishMessage(chatId: string): Promise<void> {
  await telegramBot.telegram.sendMessage(
    chatId,
    "🎉 Тест пройден!\n\nСкоро тут появятся твои результаты"
  );
}

async function sendQuizResultsMessage(
  chatId: string,
  sessionId: string,
  telegramUser: string
): Promise<void> {
  const stats = await databaseService.getQuizStatByUserSession(sessionId, telegramUser);

  if (!stats) {
    await telegramBot.telegram.sendMessage(
      chatId,
      "Произошла ошибка: бот не смог загрузить результаты теста. \nНе перееживайте, мы свяжемся с вами и пришлем результаты"
    );
    return;
  }

  const { correctAnswers, proficiencyLevel } = stats;

  const resultMessage =
    `🎉 Вы прошли тест!\n\n` +
    `Правильных ответов: ${correctAnswers} из ${TOTAL_QUESTIONS}\n` +
    `Ваш уровень: ${proficiencyLevel}`;

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
