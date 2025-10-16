import { VercelRequest, VercelResponse } from '@vercel/node';
import { Logger } from '../src/utils/logger';
import { config } from '../src/app-config';
import { Question, QuestionsApiRes } from '../src/models/questions.interface';
import { SupabaseQuestionsService } from '../src/services/supabase-questions.service';

const logger = new Logger();
const questionsService = new SupabaseQuestionsService(config);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const questions: Question[] = await questionsService.getAllQuestions();

    if (!questions.length) {
      return res.status(204).json({ message: "There are no questions" });
    }

    const response: QuestionsApiRes<Question[]> = {
      items: questions,
      counter: { total: questions.length }
    };

    return res.json(response);
  } catch (error) {
    logger.log({ type: 'error', message: 'Error fetching questions', error });
    return res.status(500).json({ message: "Internal server error" });
  }
}
