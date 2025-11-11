import { Logger } from '../utils/logger';
import { config } from '../app-config';
import { AnswerRequest } from '../models/answers.interface';
import { SupabaseQuestionsService } from '../services/supabase-questions.service';
import { DatabaseService } from '../services/database.service';

export class AnswersWorker {
  private logger: Logger;
  private questionsService: SupabaseQuestionsService;

  constructor() {
    this.logger = new Logger();
    this.questionsService = new SupabaseQuestionsService(config);
  }

  async process(payload: AnswerRequest, newAnswerId: number): Promise<void> {
    const { telegramUser, questionId, answerId, sessionId } = payload;

    try {
      const databaseService = await DatabaseService.create();
      const isCorrect = await this.questionsService.validateAnswer(questionId, answerId);

      if (isCorrect === null) {
        this.logger.log({ type: 'error', message: `Question/answer not found (q:${questionId}, a:${answerId})` });
        return;
      }

      await databaseService.updateUserAnswer(newAnswerId, isCorrect);
      this.logger.log({ type: 'event', message: `Answer ${newAnswerId} is checked for user ${telegramUser}` });
    } catch (err: any) {
      this.logger.log({ type: 'error', message: 'Worker processing failed', error: err });
    }
  }
}
