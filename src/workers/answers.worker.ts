import { Logger } from '../utils/logger';
import { config } from '../app-config';
import { AnswerRequest } from '../models/answers.interface';
import { SupabaseQuestionsService } from '../services/supabase-questions.service';
import { AnswerEntry } from '../models/database.interface';
import { DatabaseService } from '../services/database.service';
import { createId } from '@paralleldrive/cuid2';

export class AnswersWorker {
  private logger: Logger;
  private questionsService: SupabaseQuestionsService;

  constructor() {
    this.logger = new Logger();
    this.questionsService = new SupabaseQuestionsService(config);
  }

  async process(payload: AnswerRequest): Promise<void> {
    const { telegramUser, questionId, answerId, sessionId } = payload;

    try {
      const databaseService = await DatabaseService.create();
      const isCorrect = await this.questionsService.validateAnswer(questionId, answerId);

      if (isCorrect === null) {
        this.logger.log({ type: 'error', message: `Question/answer not found (q:${questionId}, a:${answerId})` });
        return;
      }

      const userAnswer: AnswerEntry = {
        id: createId(),
        questionId,
        answerId,
        isCorrect,
        createdAt: new Date().toISOString(),
      };

      await databaseService.saveUserAnswer(sessionId, telegramUser, userAnswer);
      this.logger.log({ type: 'event', message: `Answer saved for user ${telegramUser}` });
    } catch (err: any) {
      this.logger.log({ type: 'error', message: 'Worker processing failed', error: err });
    }
  }
}
