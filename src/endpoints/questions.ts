import express, { Request, Response } from 'express';
import { Logger } from '../utils/logger';
import { MockQuestionsService } from '../services/mock-questions.service';
import { config } from '../app-config';
import {Question, QuestionsApiRes} from '../models/questions.interface';

const questionsRouter = express.Router();
const logger = new Logger();

const questionsService = new MockQuestionsService(config);

// GET /questions
questionsRouter.get("/questions/", async (req: Request, res: Response) => {
  try {
    const questions: Question[] = await questionsService.getAllQuestions();

    if (!questions.length) {
      res.status(204).json({ message: "There are no questions" });
      return;
    }

    const response: QuestionsApiRes<Question[]> = {
      items: questions,
      counter: { total: questions.length }
    };

    res.json(response);
  } catch (error) {
    logger.log({ type: 'error', message: 'Error fetching questions', error });
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /questions/:id
questionsRouter.get("/questions/:id", async (req: Request, res: Response) => {
  try {
    const questionsCount: number = await questionsService.getQuestionsTotalCount();
    const id = Number(req.params.id);
    const question: Question = await questionsService.getQuestionById(id);

    if (!question) {
      res.status(404).json({ message: "No such question" });
      return;
    }

    const response: QuestionsApiRes<Question[]> = {
      items: [question],
      counter: { total: questionsCount, currentNumber: id }
    };

    res.json(response);
  } catch (error) {
    logger.log({ type: 'error', message: 'Error fetching questions', error });
    res.status(500).json({ message: "Internal server error" });
  }
});

export default questionsRouter;
