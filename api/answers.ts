import { VercelRequest, VercelResponse } from '@vercel/node';
import { DatabaseService } from '../src/services/database.service';
import { Logger } from '../src/utils/logger';
import { config } from '../src/app-config';
import { AnswerRequest } from '../src/models/answers.interface';
import { AnswerEntry } from '../src/models/database.interface';
import { SupabaseQuestionsService } from '../src/services/supabase-questions.service';

const questionsService = new SupabaseQuestionsService(config);
const logger = new Logger();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, telegramUser, questionId, answerId, sessionId }: AnswerRequest = req.body;

  const isTokenValid = await questionsService.validateToken(token);
  if (!sessionId || !token || !isTokenValid) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const databaseService = await DatabaseService.create();
    const isCorrect = await questionsService.validateAnswer(questionId, answerId);
    if (isCorrect === null) {
      logger.log({ type: "error", message: `Question/answer not found (q:${questionId}, a:${answerId})` });
      return res.status(400).json({ message: "Question or answer not found" });
    }

    const userAnswer: AnswerEntry = {
      id: '',
      questionId,
      answerId,
      isCorrect,
      createdAt: '',
    };

    logger.log({ type: "event", message: `User ${telegramUser} answered q${questionId} with a${answerId}` });
    await databaseService.saveUserAnswer(sessionId, telegramUser, userAnswer);

    return res.json({ status: "ok", correct: isCorrect });
  } catch (error) {
    logger.log({ type: "error", message: "Error processing answer", error });
    return res.status(500).json({ message: "Failed to save answer" });
  }
}
