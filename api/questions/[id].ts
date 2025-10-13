import { VercelRequest, VercelResponse } from '@vercel/node';
import { Logger } from '../../src/utils/logger';
import { MockQuestionsService } from '../../src/services/mock-questions.service';
import { config } from '../../src/app-config';
import { Question, QuestionsApiRes } from '../../src/models/questions.interface';

const logger = new Logger();
const questionsService = new MockQuestionsService(config);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const questionsCount: number = await questionsService.getQuestionsTotalCount();
    const id = Number(req.query.id);
    const question: Question = await questionsService.getQuestionById(id);

    if (!question) {
      return res.status(404).json({ message: "No such question" });
    }

    const response: QuestionsApiRes<Question[]> = {
      items: [question],
      counter: { total: questionsCount, currentNumber: id }
    };

    return res.json(response);
  } catch (error) {
    logger.log({ type: 'error', message: 'Error fetching question by ID', error });
    return res.status(500).json({ message: "Internal server error" });
  }
}
