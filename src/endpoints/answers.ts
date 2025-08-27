import express, { Request, Response, Router } from 'express';
import { AnswerRequest } from '../models/answer.request';
import { AnswerEntry } from '../models/database.interface';
import { DatabaseService } from '../services/database.service';
import { MockQuestionsService } from '../services/mock-questions.service';
import { config } from '../app-config';
import { Logger } from '../utils/logger';

export class AnswersRouter {
  public readonly router: Router;
  private readonly databaseService: DatabaseService;
  private readonly questionsService: MockQuestionsService;
  private readonly logger: Logger;

  constructor(databaseService: DatabaseService) {
    this.router = express.Router();
    this.databaseService = databaseService;
    this.questionsService = new MockQuestionsService(config);
    this.logger = new Logger();
  }

  public registerRoutes(): Router {
    this.router.post("/answers", this.answerRouteHandler.bind(this));
    return this.router;
  }

  // POST /answers
  private async answerRouteHandler(req: Request, res: Response): Promise<Response> {
    const { token, telegramUser, questionId, answerId, timestamp }: AnswerRequest = req.body;

    const isTokenValid = await this.questionsService.validateToken(token);
    if (!isTokenValid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const isCorrect = await this.questionsService.validateAnswer(questionId, answerId);

      const userAnswer: AnswerEntry = {
        telegramUser,
        questionId,
        answerId,
        isCorrect,
        timestamp,
      };

      this.logger.log({ type: 'event', message: `Answer received ${answerId}` });
      await this.databaseService.saveUserAnswer(userAnswer);
      this.logger.log({ type: 'event', message: `Answer saved ${answerId}` });

      return res.json({ status: "ok", correct: isCorrect });
    } catch (error) {
      this.logger.log({ type: 'error', message: 'Error processing answer', error });

      if (error instanceof Error && (error.message === 'Question not found' || error.message === 'Answer not found')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Failed to save answer" });
    }
  }
}


