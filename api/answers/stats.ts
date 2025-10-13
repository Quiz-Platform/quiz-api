import { VercelRequest, VercelResponse } from '@vercel/node';
import { DatabaseService } from '../../src/services/database.service';
import { MockQuestionsService } from '../../src/services/mock-questions.service';
import { Logger } from '../../src/utils/logger';
import { config } from '../../src/app-config';
import { AnswerRequest } from '../../src/models/answers.interface';

const questionsService = new MockQuestionsService(config);
const logger = new Logger();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, telegramUser, sessionId }: AnswerRequest = req.body;

  const isTokenValid = await questionsService.validateToken(token);
  if (!sessionId || !token || !isTokenValid) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const databaseService = await DatabaseService.create();
    const statistics = await databaseService.getQuizStatByUserSession(sessionId, telegramUser);

    if (!statistics) {
      return res.status(404).json({ message: "No statistics found for this user or session" });
    }

    return res.json(statistics);
  } catch (error) {
    logger.log({ type: 'error', message: 'Error fetching statistics', error });
    return res.status(500).json({ message: "Internal server error" });
  }
}
