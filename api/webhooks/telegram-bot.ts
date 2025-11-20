import {VercelRequest, VercelResponse} from '@vercel/node';
import { config } from '../../src/app-config';
import { Question } from '../../src/models/questions.interface';
import { SupabaseQuestionsService } from '../../src/services/supabase-questions.service';
import { DatabaseService } from '../../src/services/database.service';
import { Logger } from '../../src/utils/logger';

const logger = new Logger();

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
 * Register bot handlers once
 */
function registerBot(): void {
  telegramBot.command(botCommands.START, async (ctx) => {
    const chatId = ctx.chat.id
    helloMessage(chatId);
  });

  telegramBot.action(botTriggers.START, async (ctx) => {


    await ctx.answerCbQuery();
    const chatId = ctx.chat.id.toString();

    const db = await getDb();
    await db.setUserProgress(chatId, chatId, 1);

    await ctx.reply("Всего в тесте 30 вопросов 🤩\nВыбери правильный ответ⬇");
    await sendQuizQuestionToChat(chatId, 1);
  });

  telegramBot.on('callback_query', async (ctx) => {
    const query = ctx.callbackQuery;
    if (!query || !('data' in query)) return;

    await ctx.answerCbQuery();

    const chatId = ctx.chat.id.toString();
    const answerId = query.data;

    const db = await getDb();
    const currentQuestionId = await db.getUserProgress(chatId);
    if (!currentQuestionId) return;

    logger.log({
      type: 'event',
      message: `Got answer ${answerId} for question ${currentQuestionId} from user ${chatId}`
    });

    await db.createUserAnswer(chatId, chatId, {
      questionId: currentQuestionId,
      answerId: Number(answerId),
      isCorrect: null,
      createdAt: new Date().toISOString()
    });

    const total = await questionsService.getQuestionsTotalCount();
    const nextQuestionId = currentQuestionId + 1;

    if (nextQuestionId > total) {
      await sendQuizFinishMessage(chatId);
      return;
    }

    await db.setUserProgress(chatId, chatId, nextQuestionId);

    await sendQuizQuestionToChat(chatId, nextQuestionId);
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
 * Final message
 */
async function sendQuizFinishMessage(chatId: string): Promise<void> {
  await telegramBot.telegram.sendMessage(
    chatId,
    "🎉 Тест пройден!\n\nМы проверим твои результаты и определим уровень в течение 24 часов."
  );
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
