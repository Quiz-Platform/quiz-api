import express, { Request, Response, Router } from 'express';
import { AnswerRequest } from '../models/answers.interface';
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
    const { token, telegramUser, questionId, answerId, sessionId }: AnswerRequest = req.body;

    const isTokenValid = await this.questionsService.validateToken(token);
    if (!sessionId || !token || !isTokenValid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const isCorrect = await this.questionsService.validateAnswer(questionId, answerId);

      const userAnswer: AnswerEntry = {
        id: null,
        questionId,
        answerId,
        isCorrect,
        createdAt: null,
      };

      this.logger.log({ type: 'event', message: `User ${telegramUser} submitted an answer id ${answerId} for question id ${questionId}` });
      await this.databaseService.saveUserAnswer(sessionId, telegramUser, userAnswer);
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


