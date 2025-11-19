import {VercelRequest, VercelResponse} from '@vercel/node';
import { config } from '../../src/app-config';
import { Question } from '../../src/models/questions.interface';
import { SupabaseQuestionsService } from '../../src/services/supabase-questions.service';
import { Logger } from '../../src/utils/logger';

const logger = new Logger();
const questionsService = new SupabaseQuestionsService(config);
const telegramBot = config.bot;

enum botCommands {
  START = 'start_test',
}

function helloMessage(): void {
  telegramBot.command(botCommands.START, async (ctx) => {
    await ctx.reply(
      "Мы поможем тебе!\n\n" +
      "Всего в тесте 30 вопросов 🇮🇹\n" +
      "Для прохождения — просто выбери правильный ответ. После мы проверим его и определим твой уровень в течение 24 часов!\n\n" +
      "Жми — пройти тест👇",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Пройти тест 📝", callback_data: "start_quiz" }]
          ]
        }
      }
    );
  });

  telegramBot.action("start_quiz", async (ctx) => {
    await ctx.answerCbQuery();
    const chatId = ctx.chat.id.toString();

    await ctx.reply(
      "Всего в тесте 30 вопросов 🤩\nВыбери правильный ответ⬇"
    );

    await sendQuizQuestionToChat(chatId, 1);
  });

  telegramBot.on("callback_query", async (ctx) => {
    const query = ctx.callbackQuery;

    if (query && "data" in query) {
      const data = query.data;
      const chatId = ctx.chat.id.toString();

      await ctx.answerCbQuery();

      const answerId = data;

      logger.log({ type: 'event', message: `Got answer ${answerId} from user ${chatId}` });

      const nextId = 2;

      await sendQuizQuestionToChat(chatId, nextId);
    }
  });
}

async function sendQuizQuestionToChat(chatId: string, questionId: number): Promise<void> {
  logger.log({ type: 'event', message: `Sending question ${questionId} to the chat ${chatId}` });

  const question: Question = await questionsService.getQuestionById(questionId);

  telegramBot.telegram.sendMessage(chatId, question.text, {
    reply_markup: {
      inline_keyboard: question.options.map((o) => [
        { text: o.text, callback_data: o.id.toString() }
      ])
    }
  });
}

helloMessage();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "POST") {
    const update = req.body;
    await telegramBot.handleUpdate(update);
    res.status(200).end();
  } else {
    res.status(200).send("OK");
  }
}
